-- Add missing RLS policy for report_evidence
CREATE POLICY "Users can manage evidence for their reports" ON public.report_evidence FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_reports 
  WHERE user_reports.id = report_evidence.report_id 
  AND user_reports.reporter_id = auth.uid()
));

-- Add admin policy for report_evidence
CREATE POLICY "Admins can view all report evidence" ON public.report_evidence FOR SELECT 
USING (is_admin());