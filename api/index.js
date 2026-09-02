import products from '../lib/handlers/products.js';
import adminProducts from '../lib/handlers/admin-products.js';
import adminUpload from '../lib/handlers/admin-upload.js';
export default async function handler(req,res){const route=String(req.query?.route||'');if(route==='products')return products(req,res);if(route==='admin-products')return adminProducts(req,res);if(route==='admin-upload')return adminUpload(req,res);return res.status(404).json({error:'Not found'});}
