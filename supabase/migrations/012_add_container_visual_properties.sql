-- Add visual properties to containers table for the visual page builder

DO $$ 
BEGIN
  -- Add width column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'containers' AND column_name = 'width') THEN
    ALTER TABLE containers ADD COLUMN width text;
  END IF;

  -- Add height column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'containers' AND column_name = 'height') THEN
    ALTER TABLE containers ADD COLUMN height text;
  END IF;

  -- Add min_height column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'containers' AND column_name = 'min_height') THEN
    ALTER TABLE containers ADD COLUMN min_height text;
  END IF;
END $$;