/**
 * Vercel Serverless Function - Backend API Proxy
 * ⚠️ 임시 SSL 검증 우회용 - 개발/테스트 전용
 * TODO: 백엔드 SSL 인증서 설정 후 제거 필요
 */

import https from 'https';
import axios from 'axios';

const BACKEND_URL = 'https://34.158.193.95/api';

// SSL 검증 우회 에이전트 (⚠️ 개발용만!)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Query string 파싱
    const url = new URL(req.url, `https://${req.headers.host}`);

    // /api/proxy 경로 제거
    let path = url.pathname.replace(/^\/api\/proxy/, '') || '/';

    // Query string 추가 (단, Vercel이 추가한 path 파라미터는 제외)
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete('path'); // Vercel 리라이트가 추가한 중복 path 제거

    const cleanSearch = searchParams.toString();
    if (cleanSearch) {
      path += '?' + cleanSearch;
    }

    const targetUrl = `${BACKEND_URL}${path}`;

    console.log('📤 [REQUEST] v2', {
      method: req.method,
      originalUrl: req.url,
      targetUrl,
      pathRemoved: 'YES',
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer ***' : undefined,
      },
      body: req.body
    });

    // 🔍 채팅 요청 상세 로깅
    if (req.url.includes('/chat/message')) {
      console.log('💬 [CHAT REQUEST DETAIL]', {
        fullAuthHeader: req.headers['authorization'],
        bodyContent: JSON.stringify(req.body),
        allHeaders: req.headers
      });
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'authorization': req.headers['authorization'],
      },
      data: req.body,
      httpsAgent, // ⚠️ SSL 검증 우회
      validateStatus: () => true, // 모든 상태 코드 허용
      // 추가 SSL 우회 옵션
      maxRedirects: 5,
      timeout: 30000,
    });

    console.log('📥 [RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    // 🔍 채팅 엔드포인트 특별 로깅
    if (req.url.includes('/chat/message')) {
      console.log('💬 [CHAT RESPONSE DETAIL]', {
        backendStatus: response.status,
        backendStatusText: response.statusText,
        backendDataType: typeof response.data,
        backendDataKeys: response.data ? Object.keys(response.data) : 'null',
        backendDataSample: JSON.stringify(response.data).substring(0, 200),
        responseHeaders: response.headers,
        willSendStatus: response.status
      });
    }

    // 🔍 403 에러 특별 로깅
    if (response.status === 403) {
      console.error('🚨 403 FORBIDDEN DETECTED:', {
        originalUrl: req.url,
        targetUrl,
        requestHeaders: {
          authorization: req.headers['authorization'] ? 'Bearer ' + req.headers['authorization'].substring(7, 20) + '...' : 'MISSING',
          contentType: req.headers['content-type']
        },
        requestBody: req.body,
        responseStatus: response.status,
        responseData: response.data,
        responseHeaders: response.headers
      });
    }

    // 응답 헤더 복사
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    // 응답 전달
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('🚨 PROXY ERROR:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      url: req.url,
      method: req.method,
      targetUrl: `${BACKEND_URL}${req.url.replace(/^\/api\/proxy/, '')}`,
      body: req.body,
      // SSL 관련 에러인지 확인
      isSSLError: error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
                  error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
                  error.message?.includes('certificate') ||
                  error.message?.includes('SSL')
    });

    // SSL 에러인 경우 특별 처리
    if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        error.message?.includes('certificate')) {
      res.status(502).json({
        error: 'SSL Certificate Error',
        message: 'Backend SSL certificate verification failed',
        details: 'The backend is using a self-signed certificate. Please install a valid SSL certificate.',
        originalError: error.message
      });
    } else {
      res.status(500).json({
        error: 'Proxy Error',
        message: error.message,
        details: error.stack
      });
    }
  }
}
