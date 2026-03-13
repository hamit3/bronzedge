-- ==========================================
-- GEOFENCES TABLOSU RLS TEMİZLİĞİ VE DÜZELTME
-- ==========================================

-- 1. Eski kısıtlı politikaları temizle
DROP POLICY IF EXISTS "Users can view geofences for their organizations" ON public.geofences;
DROP POLICY IF EXISTS "Admins and Operators can insert geofences" ON public.geofences;
DROP POLICY IF EXISTS "Admins and Operators can update geofences" ON public.geofences;
DROP POLICY IF EXISTS "Admins and Operators can delete geofences" ON public.geofences;

-- 2. Yeni ve Mimic/Admin destekli politikalar

-- GÖRÜNTÜLEME: Admin her şeyi görür, diğerleri kendi organizasyonunu görür.
CREATE POLICY "Geofences select policy" 
ON public.geofences FOR SELECT 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR 
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- EKLEME: 
CREATE POLICY "Geofences insert policy" 
ON public.geofences FOR INSERT 
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'operator')
    OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);

-- GÜNCELLEME:
CREATE POLICY "Geofences update policy" 
ON public.geofences FOR UPDATE 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'operator')
    OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);

-- SİLME:
CREATE POLICY "Geofences delete policy" 
ON public.geofences FOR DELETE 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'operator')
    OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);

-- RLS'nin açık olduğundan emin olalım
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
