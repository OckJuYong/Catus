/**
 * Vercel Serverless Function - Backend API Proxy
 * HTTPS 연결 (자체 서명 인증서 허용)
 */

import https from 'https';
import axios from 'axios';

// HTTPS 연결 (443 포트)
const BACKEND_URL = 'https://34.158.193.95/api';

// 자체 서명 인증서 허용을 위한 HTTPS Agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // 자체 서명 인증서 허용
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
      incomingHeaders: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer ***' : undefined,
        'host': req.headers['host'],
        'origin': req.headers['origin'],
        'referer': req.headers['referer'],
      },
      outgoingHeaders: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] ? 'Bearer ***' : undefined,
      },
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null
    });

    // 🔍 채팅 요청 상세 로깅
    if (req.url.includes('/chat/message')) {
      console.log('💬 [CHAT REQUEST DETAIL]', {
        fullAuthHeader: req.headers['authorization'],
        bodyContent: JSON.stringify(req.body),
        allHeaders: req.headers
      });
    }

    // 실제 전송될 헤더 구성
    const requestHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': req.headers['authorization'],
    };

    console.log('🔧 [AXIOS CONFIG]', {
      method: req.method,
      url: targetUrl,
      headers: requestHeaders,
      dataPresent: !!req.body,
      dataType: typeof req.body,
    });

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: requestHeaders,
      data: req.body,
      httpsAgent, // HTTPS 자체 서명 인증서 허용
      validateStatus: () => true, // 모든 상태 코드 허용
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
        sentHeaders: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Authorization': req.headers['authorization'] ? 'Bearer ' + req.headers['authorization'].substring(7, 20) + '...' : 'MISSING',
        },
        requestBody: req.body,
        requestBodyString: JSON.stringify(req.body),
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseData: response.data,
        responseDataString: JSON.stringify(response.data),
        responseHeaders: response.headers,
        nginxHeaders: {
          server: response.headers['server'],
          'x-content-type-options': response.headers['x-content-type-options'],
          'strict-transport-security': response.headers['strict-transport-security'],
        }
      });
    }

    // 응답 헤더 선택적 복사 (보안 헤더 제외 - Vercel이 자동 추가)
    const headersToSkip = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'permissions-policy',
      'referrer-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'server', // nginx 서버 정보 숨김
      'connection',
      'transfer-encoding',
    ];

    Object.keys(response.headers).forEach(key => {
      if (!headersToSkip.includes(key.toLowerCase())) {
        res.setHeader(key, response.headers[key]);
      }
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
