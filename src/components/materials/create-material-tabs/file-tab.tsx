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
      name="files"
      rules={{ required: 'Please select at least one file.' }}
      render={({ field: { value, onChange, ...fieldProps } }) => (
        <FormItem>
          <FormLabel>Upload Files</FormLabel>
          <FormControl>
            <Input
              {...fieldProps}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              multiple
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
