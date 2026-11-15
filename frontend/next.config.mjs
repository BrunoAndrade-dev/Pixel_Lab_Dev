const api = process.env.SPRING_API_URL || 'http://127.0.0.1:8080';
export default {
  async rewrites() {
    return [{source: '/api/:path*', destination: api + '/api/:path*'}];
  }
};
