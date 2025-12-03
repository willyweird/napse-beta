import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ythjcyjlyfncsoiqsaod.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aGpjeWpseWZuY3NvaXFzYW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDM0MzUsImV4cCI6MjA4MDE3OTQzNX0.9lTfow4wdY2nAxAxEPprZXGN-xWky7vA_z4wQZ91oxY"
);
