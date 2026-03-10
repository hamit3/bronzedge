-- Geofences tablosu oluşturuluyor
CREATE TABLE IF NOT EXISTS public.geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'polygon', -- 'polygon', 'rectangle', 'circle'
    coordinates JSONB NOT NULL, -- Poligon için array of {lat, lng}, Daire için center {lat, lng}
    radius NUMERIC, -- Daire ise yarıçap (metre)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

-- Politikalar (Sadece kullanıcının bulunduğu organizasyondaki alanlar görünür)
CREATE POLICY "Users can view geofences for their organizations" 
ON public.geofences FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins and Operators can insert geofences" 
ON public.geofences FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        AND role IN ('admin', 'operator')
    )
);

CREATE POLICY "Admins and Operators can update geofences" 
ON public.geofences FOR UPDATE 
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        AND role IN ('admin', 'operator')
    )
);

CREATE POLICY "Admins and Operators can delete geofences" 
ON public.geofences FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        AND role IN ('admin', 'operator')
    )
);
