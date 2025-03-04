import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy } from '@angular/fire/firestore';
import { XplorersPointsTransaction } from '../types/xplorers-points-types';

@Injectable({
  providedIn: 'root'
})
export class XplorersPointsService {
  private firestore = inject(Firestore);

  constructor() {}

  /**
   * Obtiene el saldo total de puntos sumando todas las transacciones de un usuario.
   * @param userId ID del usuario
   * @returns Puntos actuales
   */
  async getUserPoints(userId: string): Promise<number> {
    const transactionsRef = collection(this.firestore, 'pointsTransactions');
    const q = query(transactionsRef, where('userId', '==', userId), orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    let totalPoints = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data() as XplorersPointsTransaction;
      if (data.type === 'add') {
        totalPoints += data.points;
      } else if (data.type === 'subtract') {
        totalPoints -= data.points;
      }
    });

    return totalPoints;
  }

  /**
   * Agrega una transacción de puntos cuando el usuario realiza una reservación
   * @param userId ID del usuario
   * @param points Cantidad de puntos a agregar
   * @param description (Opcional) Descripción de la transacción
   */
  async addPoints(userId: string, points: number, description?: string): Promise<void> {
    const transactionsRef = collection(this.firestore, 'pointsTransactions');

    const transaction: XplorersPointsTransaction = {
      userId,
      type: 'add',
      points,
      description: description || `Se agregaron ${points} XplorersPoints.`,
      timestamp: new Date().toISOString()
    };

    await addDoc(transactionsRef, transaction);
  }

  /**
   * Redime puntos generando una transacción de tipo "subtract".
   * @param userId ID del usuario
   * @param points Cantidad de puntos a redimir
   * @param description (Opcional) Descripción de la transacción
   * @returns Mensaje con el resultado
   */
  async redeemPoints(userId: string, points: number, description?: string): Promise<string> {
    const totalPoints = await this.getUserPoints(userId);

    if (totalPoints < points) {
      return 'No tienes suficientes puntos.';
    }

    const transactionsRef = collection(this.firestore, 'pointsTransactions');

    const transaction: XplorersPointsTransaction = {
      userId,
      type: 'subtract',
      points,
      description: description || `Se redimieron ${points} XplorersPoints.`,
      timestamp: new Date().toISOString()
    };

    await addDoc(transactionsRef, transaction);

    return `Has redimido ${points} XplorersPoints.`;
  }
}
