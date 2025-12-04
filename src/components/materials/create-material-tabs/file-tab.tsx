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

export function FileTab({ control }: { control: Control<any> }) {
  return (
    <FormField
      control={control}
      name="file"
      rules={{ required: 'Please select a file.' }}
      render={({ field: { value, onChange, ...fieldProps } }) => (
        <FormItem>
          <FormLabel>Upload File</FormLabel>
          <FormControl>
            <Input
              {...fieldProps}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(event) => {
                onChange(event.target.files && event.target.files[0]);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
