/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['i.imgur.com', 'external-preview.redd.it', 'preview.redd.it', 'i.redd.it'],
  },
}

module.exports = nextConfig