import * as functions from 'firebase-functions';
import { join } from 'path';
import axios from 'axios';
import * as admin from 'firebase-admin';

const angularServerDistPath = join(__dirname, 'ssr-bundle');
const fullMjsPath = join(angularServerDistPath, 'server.mjs');

console.log('DEBUG: Intentando importar server.mjs desde:', fullMjsPath);

const serverAppPromise = import(fullMjsPath);

export const ssrApp = functions.https.onRequest(async (request, response) => {
  try {
    const serverModule = await serverAppPromise;
    const app = serverModule.app();
    app(request, response);
  } catch (error) {
    console.error("Error al inicializar o ejecutar la aplicación SSR:", error);
    response.status(500).send("Error interno del servidor.");
  }
});

// ---- FUNCIÓN PAYCLIP ----
const TOKEN = "Basic M2VlNDk4MzctZTgyOC00MDdjLWFlMjgtYTI1YzdlZGM1NDc4OjE0ODRmYjUyLTgyOTEtNDdkZC1hNjZiLWExMTJhN2Q3MDcyZg==";
const TEST_TOKEN = "Basic dGVzdF9hM2Q5YmZkMC03Y2EyLTRmMTAtYjhmOS0xZDk2NzY1MGQ4ZGU6MzA3NDY4MGUtZTNhMS00ZGNkLWE1MWItZTU5MTQ3MjRmNjQy";
const TEST_API_KEY = "test_a3d9bfd0-7ca2-4f10-b8f9-1d967650d8de";
const API_KEY = "3ee49837-e828-407c-ae28-a25c7edc5478";



if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
const commentsRef = db.collection('comments');

export const comments = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Test'
  });
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    const path = req.path.toLowerCase();
    const method = req.method;

    if (path === '/create' && method === 'POST') {
      const { name, comment, date, rate, ia } = req.body;
      if (!name || !comment || !date || !rate || !ia) {
        console.log(req.body);
        res.status(400).json({ message: 'Faltan datos: name, comment, date' });
        return;
      }

      const docRef = await commentsRef.add({
        name,
        comment,
        date: new Date(date),
        rate,
        ia
      });

      res.status(201).json({ message: 'Comentario creado', id: docRef.id });
      return;
    }

    if (path === '/list' && method === 'GET') {
      const snapshot = await commentsRef.orderBy('date', 'desc').get();
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.status(200).json(comments);
      return;
    }

    if (path === '/get' && method === 'GET') {
      const id = req.query.id as string;
      if (!id) {
        res.status(400).json({ message: 'Falta el parámetro id' });
        return;
      }

      const doc = await commentsRef.doc(id).get();
      if (!doc.exists) {
        res.status(404).json({ message: 'Comentario no encontrado' });
        return;
      }

      res.status(200).json({ id: doc.id, ...doc.data() });
      return;
    }

    if (path === '/delete' && method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) {
        res.status(400).json({ message: 'Falta el parámetro id' });
        return;
      }

      await commentsRef.doc(id).delete();
      res.status(200).json({ message: 'Comentario eliminado' });
      return;
    }

    // Si no coincide ninguna ruta
    res.status(404).json({ message: 'Ruta o método no válido' });

  } catch (error) {
    console.error('Error en commentsApi:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export const payclipPayment = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Test'
  });

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  const testPayment = req.headers['test'] === 'true';
  const authorizationToken = testPayment ? TEST_TOKEN : TOKEN;
  const clientIp = ((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string).split(',')[0].trim().match(/\d+\.\d+\.\d+\.\d+/)?.[0] || '0.0.0.0';
  console.log('IP del cliente 2:', clientIp);
  try {
    const paymentRequest = await axios.post(
      'https://api.payclip.com/payments',
      {
        ...req.body,
        location: {
          ip: clientIp
        }
      },
      {
        headers: {
          'Authorization': authorizationToken,
          'Content-Type': 'application/json'
        }
      }
    );
    const paymentsCollection = db.collection('bookings').doc(req.body.external_reference).collection('gateway_payments');
    const savedDB = await paymentsCollection.add({
      processor: 'CLIP',
      processed_at: new Date(),
      response_data: paymentRequest.data
    });

    res.status(200).json({response: paymentRequest.data, id: savedDB.id});

  } catch (error: any) {
    console.error('Error en PayClip:', error.response?.data || error);

    res.status(500).json({
      error: error.response?.data || 'Error al procesar el pago'
    });
  }
});

export const payclipGetPayment = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Test'
  });
  const testPayment = req.headers['test'] === 'true';

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  const paymentId = req.query.id as string;
  const bearerToken = 'Bearer '+(testPayment?TEST_API_KEY:API_KEY);

  if (!paymentId || !bearerToken) {
    res.status(400).json({ message: 'Faltan parámetros: id y/o Authorization' });
    return;
  }

  try {
    const response = await axios.get(`https://api.payclip.com/payments/${paymentId}`, {
      headers: {
        'Authorization': bearerToken
      }
    });
    res.status(200).json(response.data);

  } catch (error: any) {
    console.error('Error en payclipGetPayment:', error.response?.data || error);
    res.status(500).json({
      error: error.response?.data || 'Error al obtener el pago'
    });
  }
});
