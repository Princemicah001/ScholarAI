
'use client';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

export function OutlineTab({ control }: { control: Control<any> }) {
  return (
    <FormField
      control={control}
      name="files"
      rules={{ required: 'Please select an outline file.' }}
      render={({ field: { value, onChange, ...fieldProps } }) => (
        <FormItem>
          <FormLabel>Upload Course Outline</FormLabel>
          <FormControl>
            <Input
              {...fieldProps}
              type="file"
              accept=".pdf,.doc,.docx"
              multiple={false}
              onChange={(event) => {
                onChange(event.target.files);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
