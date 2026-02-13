/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary (restricted to your account + upload path)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        // change 'dh46btxll' to your Cloudinary cloud name
      pathname: "/**",
      },
      // Unsplash (images served from images.unsplash.com)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },  {
        protocol: "https",
        hostname: "fastly.picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
    // optional: domains: ["res.cloudinary.com", "images.unsplash.com"], // older style
  },
};

module.exports = nextConfig;
