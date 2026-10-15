import type {NextConfig} from 'next';
const config:NextConfig={reactStrictMode:true,experimental:{cpus:2},serverExternalPackages:['node:sqlite']};export default config;
