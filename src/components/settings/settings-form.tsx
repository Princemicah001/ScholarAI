
'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export function SettingsForm() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);

    // In a real app, you'd use react-hook-form here
    // and connect this to a server action to update the user profile.

    return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" defaultValue={user?.displayName || ''} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
            </div>
             <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    )
}
