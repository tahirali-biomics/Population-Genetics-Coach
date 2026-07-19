/*
 * Population Genetics Coach
 * Copyright © 2026 Dr. Tahir Ali
 * All rights reserved. See LICENSE.
 */

import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
const configured=Boolean(url&&key&&!url.includes('YOUR_PROJECT')&&!key.includes('YOUR_SUPABASE'));
export const supabase=configured?createClient(url!,key!):null;
