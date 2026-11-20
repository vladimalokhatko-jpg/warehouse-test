export const floor=1.18;
export const shell={left:-31,right:28,back:-45,front:10};
export const slab={x:3.69,z:-13.5,width:69.9,depth:65.9};
export const warehouseTarget={x:slab.x,y:1.7,z:slab.z};
const side={...warehouseTarget,el:.59,fov:43};
export const presets={
  overall:{...side,az:.33,el:.79},
  plan:{...side,az:0,el:Math.PI/2-.004},
  front:{...side,az:0},
  left:{...side,az:-Math.PI/2},
  back:{...side,az:Math.PI},
  right:{...side,az:Math.PI/2},
};

const warehouseCorners=[slab.x-slab.width/2,slab.x+slab.width/2].flatMap(x=>
  [-.73,5.2].flatMap(y=>[slab.z-slab.depth/2,slab.z+slab.depth/2].map(z=>[x,y,z])));

export function fitWarehouse(view,aspect){
  const sinAz=Math.sin(view.az),cosAz=Math.cos(view.az);
  const sinEl=Math.sin(view.el),cosEl=Math.cos(view.el);
  const vertical=Math.tan(view.fov*Math.PI/360)*.91;
  const horizontal=vertical*aspect;
  // Perspective makes the nearer corners larger, so fit each corner at its own depth.
  return Math.max(...warehouseCorners.map(([x,y,z])=>{
    const dx=x-view.x,dy=y-view.y,dz=z-view.z;
    const along=dx*sinAz+dz*cosAz;
    const distanceToCorner=along*cosEl+dy*sinEl;
    const projectedWidth=dx*cosAz-dz*sinAz;
    const projectedHeight=dy*cosEl-along*sinEl;
    return distanceToCorner+Math.max(Math.abs(projectedWidth)/horizontal,Math.abs(projectedHeight)/vertical);
  }));
}
export const routeColors={walk:"#309b62",lift:"#d5a352"};
export const receiving={
  office:[-30.65,-21.55,-.68,3.61],
  entrance:[-30.55,-27.24,8.82,10.32],
  driverDoorX:-29.08,
  docks:[-12.88,5.23],
  handTrucks:[-23.23,-18.87,5.94,9.55],
  empties:[-7.48,-.30,5.84,7.80],
  chocks:[-7.48,-.30,8.01,9.68],
  truckFork:13.31,
  stacker:19.32,
  pedestrian:[[-30.35,-27.90,-43.60,-.72],[-30.35,-27.90,3.68,10],[-28.05,-21.60,3.68,5.03]],
};
export const charging={
  bounds:[27.5,38.45,.54,10.02],
  postX:[32.15,35.95],
  postZ:1.28,
  parkingZ:4.10,
  parkingWidth:2.59,
  parkingDepth:3.68,
  aisle:[28.12,37.85,6.38,9.30],
};
const chargingParking=charging.postX.map(x=>[
  x-charging.parkingWidth/2,x+charging.parkingWidth/2,
  charging.parkingZ-charging.parkingDepth/2,charging.parkingZ+charging.parkingDepth/2,
]);
export const dispatch={
  buffer:[13.8,21.88,-31.5,-26.65],
  dockApproach:[22.04,27.92,-30.96,-27.42],
  parkingX:[16.17,19.24],
  parkingZ:[-30.14,-27.89],
};
const dockFootprints=receiving.docks.map(x=>[x-2.67,x+2.67,8.24,10.35]);
export const groups=[
  {title:"Вход и разгрузка",zones:[
    [1,"Entrance & Office",[-30.65,-21.55,-.68,10.32],"#779c9b","Вход ENTRANCE, СИЗ и офис приёмки. Снаружи задней стены расположен SQCD и зона Tier-1 пятиминутки для распределения работ."],
    [2,"Receiving Docks",[-15.55,7.90,8.24,10.35],"#597f91","Двое секционных ворот с номерами, доклевеллерами, отбойниками и стоечными светофорами."],
    [3,"Dock Service Station",[-7.65,-.20,7.15,9.70],"#b8bdb3","Единый 5S-пост между воротами: по одному обозначенному комплекту противооткатных упоров для каждого дока, компактное место для документации и принадлежностей."],
    [4,"Wheel Chocks",[-7.20,-.70,7.85,9.55],"#c2b9a4","Два комплекта упоров и места их возврата на общем доковом посту; зона проезда перед воротами остаётся свободной."],
    [5,"Battery Charging",charging.bounds,"#819bad","Зарядные устройства у стены. Перед ними два размеченных места для техники, со стороны ворот оставлен проезд."],
    [6,"Forklift Parking", [10.55,16.12,5.99,9.60],"#b4c0b9","Выделенное парковочное место погрузчика справа от второго дока, вне проезда."],
    [7,"Reach Truck Parking", [16.22,21.70,5.99,9.60],"#b4c0b9","Парковка ричтрака в единой линии с погрузчиком, без пересечения с правым транспортным коридором."],
    [8,"Pallet Jack Parking",[-24.10,-18.40,6.07,9.60],"#b4c0b9","Две ручные гидравлические тележки в компактном общем парковочном кармане слева от первого дока."],
    [9,"Pedestrian Walkway",[-31,-27.2,-43.8,10.8],"#58a793","Продольная дорожка вдоль левой стены соединяет вход, офис и подходы к рабочим местам. На пересечениях нанесены зебры."],
    [10,"Forklift Access Aisle",[-21.2,26.0,1.18,5.59],"#d5a352","Свободная зона движения погрузчиков от ворот приёмки к основным складским проездам. Размещение паллет, буферные ячейки и хранение не предусмотрены."],
  ]},
  {title:"Приёмка и контроль",zones:[
    [11,"Receiving",[-22.40,-3.55,-3.25,.25],"#c8dce4","Receiving desk, floor scale and three inbound pallet positions; material is identified, counted and labelled before further routing."],
    [12,"Inspection",[-2.90,20.05,-3.25,.25],"#e9dfca","Inspection workstation, compact measurement cabinet and four pallet positions, used only when inspection is required."],
    [13,"Putaway Staging",[-25.35,-4.50,-9.30,-5.60],"#d3e2d5","Short-term, released pallet positions before movement to storage. No desks or other equipment inside the staging area."],
    [14,"Quarantine",[-3.75,20.10,-9.30,-5.60],"#d9d5d2","Separately fenced, controlled holding area for material requiring disposition. Access gate is along the outer aisle, clear of pallet positions."],
  ]},
  {title:"Хранение и отгрузка",zones:[
    [15,"Pallet Racking",[-9.4,11.5,-24.35,-18.0],"#a7b9bf","Три пролёта с отдельными табличками «Отремонтированные» и «Новые детали»."],
    [16,"Cantilever Racking", [13.0,20.7,-24.35,-18.0],"#7f9fab","Многоярусный консольный стеллаж с трубами и ограничителями на консолях."],
    [17,"Mezzanine",[-25.2,-11,-24.35,-18.0],"#92a9b1","Лоточное хранение на двух уровнях, лестница и ограждение верхней площадки."],
    [18,"Kitting & Packing",[-11.0,4.0,-31.4,-26.8],"#8db2c0","Стол для упаковки, принтеры A4 и Zebra и пространство для комплектования груза."],
    [19,"Packing Supplies",[5.0,12.7,-31.4,-26.8],"#bda479","Места для коробок, плёнки и запаса паллет рядом со столом упаковки."],
    [20,"MHE Parking",[-25.1,-12.05,-31.4,-26.8],"#b4a273","Припаркованные погрузчик, штабелёр и рохли, отдельные места для передвижной платформы и тележки."],
    [21,"Dispatch Staging",dispatch.buffer,"#d5b465","Четыре места ожидания паллет. Проезд к воротам свободен, рядом отдельная дверь."],
    [22,"Damaged Parts",[-25.3,-7.1,-44.4,-36.3],"#c39278","Два пролёта стеллажей с маркировкой «Неисправно»."],
    [23,"Chemical Storage",[-5.8,27.7,-44.4,-36.15],"#c5a979","Внутреннее помещение с воротами и отдельной дверью. Внутри паллетные стеллажи, лотки, температурный шкаф и стенд совместимости по SDS."],
  ]},
];
const zoneFootprints={
  1:[receiving.office,receiving.entrance],
  2:dockFootprints,
  9:receiving.pedestrian,
  21:[dispatch.buffer,dispatch.dockApproach,[27.16,28.22,-26.43,-24.94]],
};
export const zones=groups.flatMap(g=>g.zones.map(([id,name,bounds,color,description])=>({
  id,name,bounds,color,description,footprints:zoneFootprints[id]??[bounds],
  highlightFootprints:id===5 ? chargingParking : undefined,
})));
const shot=(name,x,z,y,az,el,r)=>({name,x,z,y,az,el,r,fov:39});
export const zoneCameras={
  1:[
    shot("Вход",-26.75,7.18,1.98,.02,.43,13.5),
    shot("Каски, жилеты и обувь",-30.26,6.59,2.38,1.18,.31,7.6),
    shot("Офис и окно документов",-25.82,1.65,1.93,.34,.71,11.5),
    shot("SQCD · Пятиминутка",-25.12,-1.66,2.33,Math.PI-.12,.56,10.2),
  ],
  2:[
    shot("Оба дока",-3.83,9.72,1.76,.03,.33,33),
    shot("Ворота 1",-12.88,9.82,2.15,-.31,.35,10.8),
    shot("Ворота 2",5.23,9.82,2.15,.33,.35,10.8),
  ],
  3:[shot("Доковый сервисный пост",-3.88,8.46,1.63,.12,.74,10.8)],
  4:[shot("Комплекты упоров D1/D2",-3.88,8.62,1.46,.11,.77,8.7)],
  5:[
    shot("Стоянки и проезд",33.16,4.53,1.87,.74,.71,20),
    shot("Посты у стены",34.00,2.26,2.02,.12,.46,13.4),
  ],
  6:[shot("Погрузчик",13.31,7.46,1.95,2.20,.43,7.8)],
  7:[shot("Штабелёр",19.32,7.53,2.14,2.24,.40,8.1)],
  8:[shot("Места для рохлей",-21.03,7.87,1.67,.51,.60,8.5)],
  9:[
    shot("Подход к офису",-28.55,4.18,1.57,.13,.73,17),
    shot("Дорожка вдоль стены",-28.93,-20.48,1.55,-.25,.62,20),
    shot("Переход у отгрузки",24.16,-34.55,1.54,.58,.74,11.2),
  ],
  10:[
    shot("Проезд погрузчиков",-4.20,3.26,1.75,.17,.69,34.5),
    shot("Свободный проезд от ворот 2",4.80,3.36,1.73,.46,.66,15.2),
  ],
  11:[
    shot("Receiving pallets",-10.1,-1.56,1.78,.34,.66,22.0),
    shot("Receiving workstation",-19.0,-2.15,1.95,.33,.61,10.2),
  ],
  12:[
    shot("Inspection pallets",11.5,-1.60,1.78,.39,.65,22.0),
    shot("Inspection workstation",.25,-2.12,1.99,.30,.61,10.7),
  ],
  13:[
    shot("Putaway staging",-15.1,-7.42,1.76,.37,.67,23.0),
  ],
  14:[
    shot("Quarantine fence and gate",17.4,-5.70,2.14,.32,.54,14.4),
    shot("Quarantine pallet positions",8.0,-7.47,1.89,.36,.65,23.4),
  ],
  15:[
    shot("Три пролёта",.96,-21.40,2.72,.17,.43,27.4),
    shot("Отремонтированные детали",-5.54,-21.52,2.60,.24,.36,11.5),
    shot("Новые детали",4.43,-21.49,2.60,.12,.38,19.0),
  ],
  16:[shot("Консоли и трубы",17.04,-21.55,2.61,.58,.41,13.4)],
  17:[
    shot("Лестница и оба уровня",-19.03,-21.37,2.76,-.56,.42,17),
    shot("Верхняя площадка",-17.97,-21.38,3.70,-.24,.66,12),
  ],
  18:[shot("Стол упаковки и принтеры",-5.13,-29.46,2.12,.24,.60,12.2)],
  19:[shot("Коробки, плёнка и паллеты",8.85,-29.56,1.94,.27,.52,11.5)],
  20:[
    shot("Парковочные места",-19.02,-28.87,1.94,.15,.59,19.5),
    shot("Платформа и тележка",-13.74,-29.04,1.88,.14,.51,8.4),
  ],
  21:[
    shot("Буфер и ворота",21.86,-29.29,1.98,.86,.63,20.5),
    shot("Ворота и дверь",27.78,-27.88,2.17,1.55,.42,13.4),
  ],
  22:[shot("Оба пролёта",-16.58,-40.68,2.62,.24,.44,23.8)],
  23:[
    shot("Паллетные стеллажи",4.34,-40.96,2.65,.12,.60,23.5),
    shot("Лотки и термошкаф",19.04,-41.09,2.32,.19,.57,14),
    shot("Ворота и дверь",15.38,-35.94,2.07,.13,.37,20.6),
    shot("Стенд SDS",25.72,-41.81,2.71,.10,.36,6.6),
  ],
};
