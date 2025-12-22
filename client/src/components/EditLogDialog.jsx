import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getCountryColor } from '../utils/colors';

export default function EditLogDialog({ isOpen, onClose, onSave, onDelete, date, initialData }) {
    const [countryName, setCountryName] = useState('');
    const [loading, setLoading] = useState(false);

    // Format date for display (European)
    const displayDate = date ? format(parseISO(date), 'dd/MM/yyyy') : '';

    // Reset form when dialog opens or data changes
    useEffect(() => {
        if (isOpen) {
            setCountryName(initialData?.country_name || '');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                date,
                country_name: countryName,
                // We send iso_timestamp just to satisfy likely backend requirement or keep consistent
                iso_timestamp: new Date().toISOString()
            });
            onClose();
        } catch (error) {
            console.error("Failed to save log", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Preview color based on input
    const previewColor = countryName ? getCountryColor(countryName) : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Edit Log' : 'Add Log'} - <span className="font-normal text-slate-400">{displayDate}</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <div className="relative">
                            <Input
                                id="country"
                                value={countryName}
                                onChange={(e) => setCountryName(e.target.value)}
                                placeholder="e.g. Spain"
                                className="pl-10"
                                required
                            />
                            {previewColor && (
                                <div
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-700"
                                    style={{ backgroundColor: previewColor }}
                                />
                            )}
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        {initialData && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => onDelete(date)}
                                disabled={loading}
                                className="mr-auto"
                            >
                                Delete
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Log'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
