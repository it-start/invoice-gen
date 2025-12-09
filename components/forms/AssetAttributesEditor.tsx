
import React from 'react';
import { DomainType, Asset } from '../../types';
import InputGroup from '../ui/InputGroup';

interface AssetAttributesEditorProps {
    domain: DomainType;
    attributes: Asset['attributes'];
    onChange: (key: string, value: string | number) => void;
}

export const AssetAttributesEditor: React.FC<AssetAttributesEditorProps> = ({ domain, attributes, onChange }) => {
    
    const renderVehicleFields = () => (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <InputGroup 
                label="License Plate" 
                value={attributes.plate || ''} 
                onChange={(v) => onChange('plate', v)} 
                placeholder="e.g. ABC-1234"
            />
            <InputGroup 
                label="VIN / Chassis No." 
                value={attributes.vin || ''} 
                onChange={(v) => onChange('vin', v)} 
                placeholder="17 Characters"
            />
            <InputGroup 
                label="Mileage (km)" 
                value={attributes.mileage || ''} 
                onChange={(v) => onChange('mileage', Number(v))} 
                type="number"
            />
            <InputGroup 
                label="Fuel Type" 
                value={attributes.fuelType || ''} 
                onChange={(v) => onChange('fuelType', v)} 
                placeholder="Petrol, Diesel, EV"
            />
        </div>
    );

    const renderPropertyFields = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            <InputGroup 
                label="Full Address" 
                value={attributes.address || ''} 
                onChange={(v) => onChange('address', v)} 
                placeholder="Street, City, Zip"
            />
            <div className="grid grid-cols-3 gap-4">
                <InputGroup 
                    label="Bedrooms" 
                    value={attributes.bedrooms || ''} 
                    onChange={(v) => onChange('bedrooms', Number(v))} 
                    type="number"
                />
                <InputGroup 
                    label="Bathrooms" 
                    value={attributes.bathrooms || ''} 
                    onChange={(v) => onChange('bathrooms', Number(v))} 
                    type="number"
                />
                <InputGroup 
                    label="Area (sq m)" 
                    value={attributes.area || ''} 
                    onChange={(v) => onChange('area', Number(v))} 
                    type="number"
                />
            </div>
        </div>
    );

    const renderEquipmentFields = () => (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <InputGroup 
                label="Serial Number" 
                value={attributes.serialNumber || ''} 
                onChange={(v) => onChange('serialNumber', v)} 
            />
            <InputGroup 
                label="Model Year" 
                value={attributes.modelYear || ''} 
                onChange={(v) => onChange('modelYear', Number(v))} 
                type="number"
            />
            <div className="col-span-2">
                <InputGroup 
                    label="Technical Specs" 
                    value={attributes.specs || ''} 
                    onChange={(v) => onChange('specs', v)} 
                    placeholder="Weight, Power, Dimensions..."
                />
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
                domain === 'vehicle' ? 'bg-blue-500' : 
                domain === 'property' ? 'bg-emerald-500' : 
                'bg-amber-500'
            }`}></div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                <span>{domain} Attributes</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">Type-Safe</span>
            </h3>
            
            {domain === 'vehicle' && renderVehicleFields()}
            {domain === 'property' && renderPropertyFields()}
            {(domain === 'equipment' || domain === 'coworking') && renderEquipmentFields()}
        </div>
    );
};
