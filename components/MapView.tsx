import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Rectangle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AdZone, GeoPoint, UserType, ZoneShape } from '../types';
import { DUBAI_CENTER, ZONE_PRICE_PER_SQM_MONTH, MIN_ZONE_AREA } from '../constants';
import { 
  Plus, Square, Circle as CircleIcon, X, Check, Edit2, Trash2, Save, 
  Maximize, CreditCard, DollarSign, Clock, AlertTriangle, ArrowRight, 
  ShieldCheck, ShoppingBag, Info, TrendingUp, History, Move, Layers, Calculator, GripHorizontal
} from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Icons for Edit Handles
const resizeIcon = new L.DivIcon({
  className: '',
  html: `<div class="w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-lg hover:scale-125 transition-transform cursor-nwse-resize"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const moveIcon = new L.DivIcon({
  className: '',
  html: `<div class="w-6 h-6 bg-indigo-600/90 text-white rounded-full shadow-xl flex items-center justify-center border-2 border-white cursor-move hover:scale-110 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><circle cx="12" cy="12" r="1"></circle></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const getBounds = (center: GeoPoint, width: number, height: number): L.LatLngBoundsExpression => {
  const latOffset = (height / 2) / 111111;
  const lngOffset = (width / 2) / (111111 * Math.cos(center.lat * Math.PI / 180));
  return [[center.lat - latOffset, center.lng - lngOffset], [center.lat + latOffset, center.lng + lngOffset]];
};

interface MapViewProps {
  userType: UserType;
  zones: AdZone[];
  userLocation: GeoPoint;
  onUserMove: (pos: GeoPoint) => void;
  onAddZone?: (pos: GeoPoint, shape: ZoneShape) => void;
  onUpdateZone?: (zone: AdZone) => void;
  onDeleteZone?: (zoneId: string) => void;
  isHighContrast: boolean;
  onInitiatePayment?: (zone: AdZone, duration: number, price: string) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (id: string | null) => void;
  onStartCampaign?: (zone: AdZone) => void;
}

const MapClickHandler = ({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) => {
  useMapEvents({ click: onMapClick });
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  userType, 
  zones, 
  userLocation, 
  onUserMove, 
  onAddZone, 
  onUpdateZone, 
  onDeleteZone, 
  isHighContrast, 
  onInitiatePayment,
  selectedZoneId: propSelectedZoneId,
  onSelectZone,
  onStartCampaign
}) => {
  const [internalSelectedZoneId, setInternalSelectedZoneId] = useState<string | null>(null);
  const selectedZoneId = propSelectedZoneId !== undefined ? propSelectedZoneId : internalSelectedZoneId;
  
  const setSelectedZoneId = (id: string | null) => {
    if (onSelectZone) onSelectZone(id);
    setInternalSelectedZoneId(id);
  };

  const [drawingShape, setDrawingShape] = useState<ZoneShape | null>(null);
  const [editingZone, setEditingZone] = useState<AdZone | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if (selectedZoneId) {
      const z = zones.find(z => z.id === selectedZoneId);
      if (z) {
         setEditingZone({...z});
         setTempName(z.name);
      }
    } else {
       setEditingZone(null);
       setIsEditingName(false);
    }
  }, [selectedZoneId, zones]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (userType === UserType.REGULAR) {
      onUserMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    } else if (userType === UserType.ZONE_OWNER && drawingShape && onAddZone) {
      onAddZone({ lat: e.latlng.lat, lng: e.latlng.lng }, drawingShape);
      setDrawingShape(null);
    } else {
      setSelectedZoneId(null);
    }
  };

  const calculateArea = (zone: AdZone | null) => {
    if (!zone) return 0;
    return zone.shape === 'CIRCLE' 
      ? Math.round(Math.PI * zone.radius * zone.radius) 
      : Math.round(zone.width * zone.height);
  };

  const currentArea = calculateArea(editingZone);

  const getPriceForDuration = (months: number) => {
     // Rule: Price = Area(m²) × 0.0025 USD × Months
     const rawPrice = currentArea * 0.0025 * months;
     return rawPrice.toFixed(2);
  };

  const handleUpdateField = (field: keyof AdZone, value: any) => {
     if (editingZone) {
        const updated = { ...editingZone, [field]: value };
        setEditingZone(updated);
        onUpdateZone?.(updated);
     }
  };

  // Helper to calculate handles position
  const getResizeHandlePosition = (zone: AdZone): [number, number] => {
    if (zone.shape === 'CIRCLE') {
      // Place handle on the right edge
      const lngOffset = (zone.radius) / (111111 * Math.cos(zone.center.lat * Math.PI / 180));
      return [zone.center.lat, zone.center.lng + lngOffset];
    } else {
      // Place handle on top-right corner
      const latOffset = (zone.height / 2) / 111111;
      const lngOffset = (zone.width / 2) / (111111 * Math.cos(zone.center.lat * Math.PI / 180));
      return [zone.center.lat + latOffset, zone.center.lng + lngOffset];
    }
  };

  const panelClass = isHighContrast 
    ? 'bg-black border-2 border-yellow-400 text-yellow-400' 
    : 'bg-white border border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] text-gray-800';

  return (
    <div className={`w-full h-full relative ${isHighContrast ? 'grayscale contrast-125' : ''}`}>
       <MapContainer center={[DUBAI_CENTER.lat, DUBAI_CENTER.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        <MapClickHandler onMapClick={handleMapClick} />
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          const liveZone = isSelected && editingZone ? editingZone : zone;
          const color = isSelected ? '#4f46e5' : (zone.isActive ? '#3b82f6' : '#9ca3af');
          
          return (
            <React.Fragment key={zone.id}>
              {/* SHAPE RENDER */}
              {liveZone.shape === 'CIRCLE' ? (
                <Circle 
                  center={[liveZone.center.lat, liveZone.center.lng]} 
                  radius={liveZone.radius} 
                  pathOptions={{ color, fillColor: color, fillOpacity: liveZone.isActive ? 0.3 : 0.1, weight: isSelected ? 4 : 2 }} 
                  eventHandlers={{ 
                    click: (e) => { 
                      L.DomEvent.stopPropagation(e); 
                      setSelectedZoneId(zone.id); 
                      if (userType === UserType.REGULAR) onUserMove({ lat: e.latlng.lat, lng: e.latlng.lng });
                    } 
                  }} 
                />
              ) : (
                <Rectangle 
                  bounds={getBounds(liveZone.center, liveZone.width, liveZone.height)} 
                  pathOptions={{ color, fillColor: color, fillOpacity: liveZone.isActive ? 0.3 : 0.1, weight: isSelected ? 4 : 2 }} 
                  eventHandlers={{ 
                    click: (e) => { 
                      L.DomEvent.stopPropagation(e); 
                      setSelectedZoneId(zone.id); 
                      if (userType === UserType.REGULAR) onUserMove({ lat: e.latlng.lat, lng: e.latlng.lng });
                    } 
                  }} 
                />
              )}

              {/* EDIT HANDLES - Only for Zone Owner & Selected */}
              {isSelected && userType === UserType.ZONE_OWNER && (
                <>
                  {/* Center Move Handle */}
                  <Marker 
                    position={[liveZone.center.lat, liveZone.center.lng]}
                    icon={moveIcon}
                    draggable={true}
                    eventHandlers={{
                      drag: (e) => {
                        const newPos = e.target.getLatLng();
                        handleUpdateField('center', { lat: newPos.lat, lng: newPos.lng });
                      }
                    }}
                  />

                  {/* Resize Handle */}
                  <Marker 
                    position={getResizeHandlePosition(liveZone)}
                    icon={resizeIcon}
                    draggable={true}
                    eventHandlers={{
                      drag: (e) => {
                        const handleLat = e.target.getLatLng().lat;
                        const handleLng = e.target.getLatLng().lng;
                        const center = liveZone.center;

                        if (liveZone.shape === 'CIRCLE') {
                           // Calculate new radius in meters
                           const newRadius = e.target.getLatLng().distanceTo([center.lat, center.lng]);
                           handleUpdateField('radius', Math.round(newRadius));
                        } else {
                           // Calculate new Width/Height in meters
                           // Latitude difference for Height
                           const latDiff = Math.abs(handleLat - center.lat);
                           const newHeight = latDiff * 111111 * 2; // * 2 because handle is from center to edge

                           // Longitude difference for Width (adjusting for latitude)
                           const lngDiff = Math.abs(handleLng - center.lng);
                           const newWidth = lngDiff * 111111 * Math.cos(center.lat * Math.PI / 180) * 2;

                           if (editingZone) {
                             const updated = { ...editingZone, width: Math.round(newWidth), height: Math.round(newHeight) };
                             setEditingZone(updated);
                             onUpdateZone?.(updated);
                           }
                        }
                      }
                    }}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
        {userType === UserType.REGULAR && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}
      </MapContainer>

      {userType === UserType.ZONE_OWNER && (
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
           <button 
             onClick={() => setDrawingShape(drawingShape === 'CIRCLE' ? null : 'CIRCLE')} 
             className={`p-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center ${drawingShape === 'CIRCLE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
           >
              <CircleIcon size={24} />
           </button>
           <button 
             onClick={() => setDrawingShape(drawingShape === 'RECTANGLE' ? null : 'RECTANGLE')} 
             className={`p-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center ${drawingShape === 'RECTANGLE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
           >
              <Square size={24} />
           </button>
        </div>
      )}

      {editingZone && (
        <div className={`absolute bottom-20 left-4 right-4 z-[400] rounded-[36px] p-6 animate-in slide-in-from-bottom-10 max-h-[85%] overflow-y-auto ${panelClass}`}>
           <div className="flex justify-between items-center mb-6">
              {isEditingName ? (
                 <div className="flex items-center gap-2 flex-1">
                    <input 
                      autoFocus 
                      value={tempName} 
                      onChange={e => setTempName(e.target.value)} 
                      className="flex-1 p-2 border-b-2 border-indigo-600 outline-none font-black text-lg bg-transparent" 
                    />
                    <button onClick={() => { handleUpdateField('name', tempName); setIsEditingName(false); }} className="text-green-600 p-2"><Check size={24}/></button>
                 </div>
              ) : (
                 <div className="flex-1 truncate">
                    <h3 className="font-black text-2xl flex items-center gap-2 truncate">
                       {editingZone.name}
                       <button onClick={() => setIsEditingName(true)} className="opacity-100 text-gray-600 hover:text-gray-900"><Edit2 size={16}/></button>
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>Managed Digital Location</p>
                 </div>
              )}
              <button onClick={() => setSelectedZoneId(null)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 hover:bg-gray-100 transition-colors ml-4 shrink-0"><X size={20}/></button>
           </div>
           
           {userType === UserType.ZONE_OWNER ? (
              <div className="space-y-6">
                 {/* Area & Scaling */}
                 <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-[28px] border border-gray-100 dark:border-gray-700 space-y-5">
                    <div className="flex justify-between items-center">
                       <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isHighContrast ? 'opacity-50' : 'text-gray-600'}`}>
                          <Maximize size={14} className="text-indigo-600"/> Zone Coverage
                       </span>
                       <div className={`px-4 py-1.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${currentArea < MIN_ZONE_AREA ? 'bg-red-100 text-red-600' : 'bg-green-600 text-white'}`}>
                          {currentArea < MIN_ZONE_AREA ? <AlertTriangle size={14}/> : <ShieldCheck size={14}/>}
                          {currentArea} m²
                       </div>
                    </div>

                    {editingZone.shape === 'CIRCLE' ? (
                       <div className="space-y-3">
                          <div className="flex justify-between text-[11px] font-bold text-gray-600 uppercase tracking-tighter">
                             <span>Radius (m)</span>
                             <div className="flex items-center gap-2">
                                <span className="text-indigo-600 font-black">{editingZone.radius}m</span>
                                <span className={`font-black text-[9px] px-2 py-0.5 rounded-full transition-colors ${currentArea < MIN_ZONE_AREA ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                  {currentArea} m²
                                </span>
                             </div>
                          </div>
                          <input 
                            type="range" min="4" max="500" value={editingZone.radius} 
                            onChange={(e) => handleUpdateField('radius', parseInt(e.target.value))} 
                            className="w-full h-2 bg-indigo-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                       </div>
                    ) : (
                       <div className="space-y-5">
                          <div className="space-y-3">
                             <div className="flex justify-between text-[11px] font-bold text-gray-600 uppercase tracking-tighter">
                                <span>Width (m)</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-indigo-600 font-black">{editingZone.width}m</span>
                                   <span className={`font-black text-[9px] px-2 py-0.5 rounded-full transition-colors ${currentArea < MIN_ZONE_AREA ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                      {currentArea} m²
                                   </span>
                                </div>
                             </div>
                             <input 
                               type="range" min="7" max="1000" value={editingZone.width} 
                               onChange={(e) => handleUpdateField('width', parseInt(e.target.value))} 
                               className="w-full h-2 bg-indigo-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[11px] font-bold text-gray-600 uppercase tracking-tighter">
                                <span>Height (m)</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-indigo-600 font-black">{editingZone.height}m</span>
                                   <span className={`font-black text-[9px] px-2 py-0.5 rounded-full transition-colors ${currentArea < MIN_ZONE_AREA ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                      {currentArea} m²
                                   </span>
                                </div>
                             </div>
                             <input 
                               type="range" min="8" max="1000" value={editingZone.height} 
                               onChange={(e) => handleUpdateField('height', parseInt(e.target.value))} 
                               className="w-full h-2 bg-indigo-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                          </div>
                       </div>
                    )}

                    {currentArea < MIN_ZONE_AREA && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-pulse">
                        <AlertTriangle size={24} className="text-red-500 shrink-0" />
                        <div className="text-[11px] font-bold text-red-600 leading-snug">
                          Minimum Required: {MIN_ZONE_AREA} m².<br/>
                          <span className="font-normal text-gray-600 text-[10px]">Your zone is too small to activate. Please enlarge it.</span>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                       <p className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isHighContrast ? 'opacity-40' : 'text-gray-600'}`}>
                          <Calculator size={14} className="text-gray-600"/> Pricing Plans
                       </p>
                       <span className={`text-[9px] font-black ${isHighContrast ? 'opacity-30' : 'text-gray-500'}`}>$0.0025 / m² / month</span>
                    </div>

                    <div className="space-y-3">
                       {[
                         { label: '1 Month Plan', months: 1, tag: 'Standard' },
                         { label: '3 Months Plan', months: 3, tag: 'Quarterly', highlight: true },
                         { label: '1 Year Plan', months: 12, tag: 'Annual Value' }
                       ].map(plan => {
                          const totalPrice = getPriceForDuration(plan.months);
                          return (
                            <button 
                              key={plan.label}
                              disabled={currentArea < MIN_ZONE_AREA}
                              onClick={() => onInitiatePayment?.(editingZone, plan.months, totalPrice)}
                              className={`w-full flex justify-between items-center p-5 border-2 rounded-[24px] transition-all group relative active:scale-[0.98] ${
                                currentArea < MIN_ZONE_AREA 
                                  ? 'opacity-30 border-gray-100 dark:border-gray-800 grayscale cursor-not-allowed' 
                                  : plan.highlight 
                                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-900/10' 
                                    : 'border-gray-50 dark:border-gray-800 hover:border-indigo-600 bg-white dark:bg-gray-900 shadow-sm'
                              }`}
                            >
                               {plan.highlight && (
                                 <div className="absolute -top-2 right-6 bg-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Suggested</div>
                               )}
                               <div className="flex flex-col items-start">
                                  <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>{plan.tag}</span>
                                  <span className="text-base font-black group-hover:text-indigo-600 text-gray-800">{plan.label}</span>
                                  <span className={`text-[10px] font-bold uppercase mt-1 tracking-tight ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>
                                     {plan.months} mo @ {currentArea} m²
                                  </span>
                               </div>
                               <div className="text-right">
                                  <span className="block text-2xl font-black text-indigo-700 dark:text-indigo-300 tabular-nums">${totalPrice}</span>
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${isHighContrast ? 'opacity-30' : 'text-gray-400'}`}>USD Total</span>
                               </div>
                            </button>
                          );
                       })}
                    </div>
                 </div>
                 
                 <div className="pt-2">
                    <button 
                      onClick={() => onDeleteZone?.(editingZone.id)} 
                      className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-[24px] text-[12px] font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-colors uppercase tracking-widest border border-red-50 dark:border-red-900/20"
                    >
                       <Trash2 size={18}/> Delete Managed Location
                    </button>
                 </div>
              </div>
           ) : userType === UserType.ADVERTISER && editingZone.isActive ? (
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-[24px] border border-indigo-100 dark:border-indigo-900/20">
                       <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isHighContrast ? 'opacity-50' : 'text-gray-600'}`}>CPM Rate</p>
                       <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">${editingZone.pricePer1k.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-[24px] border border-green-100 dark:border-green-900/20">
                       <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isHighContrast ? 'opacity-50' : 'text-gray-600'}`}>Reach (est.)</p>
                       <div className="flex items-center gap-2">
                          <TrendingUp size={18} className="text-green-600"/>
                          <p className="text-3xl font-black text-green-700 dark:text-green-400">~1.5k</p>
                       </div>
                    </div>
                 </div>
                 <button 
                    onClick={() => onStartCampaign?.(editingZone)} 
                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
                 >
                    <ShoppingBag size={22}/> 
                    Start Campaign Here
                    <ArrowRight size={20}/>
                 </button>
              </div>
           ) : (
             <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto border-4 border-white dark:border-gray-900 shadow-inner">
                   <Info size={40} className="text-gray-400" />
                </div>
                <div className="space-y-1">
                   <p className="text-base font-black text-gray-400 uppercase tracking-wide">Zone Inactive</p>
                   <p className="text-[11px] opacity-40 max-w-[220px] mx-auto font-bold leading-relaxed">This digital space is currently not available for advertisement campaigns.</p>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};