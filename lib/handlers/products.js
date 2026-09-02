import { getSql } from '../db.js';
import { ensureProductTables } from './_products.js';
export default async function handler(req,res){try{const sql=getSql();await ensureProductTables(sql);if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const products=await sql`SELECT id,product_code,product_name,category,retail_price,stock,image_1,image_2,image_3,description FROM dhoti_products WHERE active=TRUE ORDER BY id DESC`;return res.status(200).json({products});}catch(e){return res.status(500).json({error:e.message||'Unable to load products'});}}
