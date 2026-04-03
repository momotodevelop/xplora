import * as functions from 'firebase-functions';
import { join } from 'path';
import axios from 'axios';
import * as admin from 'firebase-admin';
//import Stripe from 'stripe';
//import { DateTime } from 'luxon';
//import { onDocumentCreated } from "firebase-functions/v2/firestore";
/*import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrdersCardVerificationMethod,
    OrdersController
} from "@paypal/paypal-server-sdk";*/


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

export const createVerificationKyc = functions.https.onRequest(async (req, res) => {
  const DIDIT_API_KEY = "oXR_Rak5sToZvLeTw10KkWel83brksuotxQ_elQW5-o"; // mueve a config en producción
  const DIDIT_BASE = 'https://verification.didit.me/v2';
  const { bookingId, amount, currency } = req.body;
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, test'
  });
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const diditWorkflowId = "cf379690-cabe-4e1e-bc00-0732dd530019";
  const diditBody: any = {
    workflow_id: diditWorkflowId,
    vendor_data: bookingId,
    metadata: {
      bookingId,
      amount,
      currency
    },
    callback:  "https://xploratravel.com.mx/reservar/realizar-pago/verificacion-tarjeta/" + bookingId,
    language: 'es'
  };
  const diditResp = await axios.post(
    `${DIDIT_BASE}/session/`,
    diditBody,
    {
      headers: {
        'X-Api-Key': DIDIT_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
  const diditSession = diditResp.data;
  res.status(200).json(diditSession);
  return;
});

// ---- FUNCIÓN PAYCLIP ----
const TOKEN = "Basic OTk2NDJiZTktOGMxNS00NjY3LWJiZGYtMTY2MTk5OTljMDlmOjMzMjY5OTZhLTU1N2YtNDZmYS1iM2FlLTE4NzgwNTVlZjJlZg==";
const TEST_TOKEN = "Basic dGVzdF9iYjljOTc4MS1lM2QzLTRlYTQtYTFkMS02MTg1NTBmNmE3YWQ6N2RiNGIzNTktNzlmZC00MWJmLWI1NTMtMTQ0YTQxNjBkZjgw";
const TEST_API_KEY = "test_bb9c9781-e3d3-4ea4-a1d1-618550f6a7ad";
const API_KEY = "99642be9-8c15-4667-bbdf-16619999c09f";



if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

export const createClipPayment = functions.https.onRequest(async (req, res) => {
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

export const getClipPaymentDetails = functions.https.onRequest(async (req, res) => {
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

  console.log('Token de autorización:', bearerToken);

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
