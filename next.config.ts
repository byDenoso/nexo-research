import createMDX from '@next/mdx';
import type {NextConfig} from 'next';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

const config: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
  reactStrictMode: true,
  images: {remotePatterns: [{protocol: 'https', hostname: 'assets.science.nasa.gov', pathname: '/content/dam/science/**'}]},
  // The private area is the existing Cockpit (PIN login on its own project). This site only points to it.
  async redirects() {
    const cockpit = 'https://nexo-one-two.vercel.app/cockpit';
    return [
      {source: '/privado', destination: cockpit, permanent: false},
      {source: '/:locale(pt|en)/privado', destination: cockpit, permanent: false}
    ];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {key: 'Content-Security-Policy', value: csp},
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'},
        {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'}
      ]
    }];
  }
};

export default createMDX({})(config);
