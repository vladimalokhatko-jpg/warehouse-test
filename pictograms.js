const blue="#1768ad";
const red="#cc302f";
const ink="#252e32";
const white="#fffdf6";

function silhouette(ctx,points,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function line(ctx,points,color,width){
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.lineJoin="round";
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.stroke();
}

function circle(ctx,x,y,r,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,2*Math.PI);
  ctx.fill();
}

const symbols={
  helmet(ctx){
    ctx.fillStyle=white;
    ctx.beginPath();
    ctx.moveTo(27,58);
    ctx.bezierCurveTo(29,37,36,29,47,27);
    ctx.lineTo(47,24);
    ctx.lineTo(55,24);
    ctx.lineTo(55,29);
    ctx.bezierCurveTo(66,31,71,40,72,57);
    ctx.lineTo(80,60);
    ctx.lineTo(79,66);
    ctx.lineTo(21,66);
    ctx.lineTo(21,60);
    ctx.closePath();
    ctx.fill();
    line(ctx,[[38,71],[43,78],[54,80],[63,75],[65,69]],white,3);
    line(ctx,[[50,29],[50,45]],blue,2.5);
  },
  gloves(ctx){
    silhouette(ctx,[[23,53],[27,50],[37,57],[35,33],[39,30],[44,32],[47,48],[47,25],
      [52,22],[57,25],[57,48],[59,28],[64,26],[69,29],[67,50],[72,37],[77,36],
      [80,40],[76,62],[69,75],[69,83],[46,83],[45,75],[36,68]],white);
    line(ctx,[[44,65],[52,61],[63,61]],blue,2.7);
  },
  boots(ctx){
    silhouette(ctx,[[31,26],[56,28],[55,49],[64,54],[75,56],[81,61],[83,69],[80,77],
      [27,77],[25,71],[27,61],[31,53]],white);
    line(ctx,[[28,69],[80,69]],blue,2.9);
    line(ctx,[[49,40],[55,41],[48,47],[55,48]],blue,2.6);
  },
  camera(ctx){
    silhouette(ctx,[[24,38],[35,38],[41,32],[58,32],[64,38],[77,38],[77,67],[24,67]],ink);
    circle(ctx,51,51,10,white);
    circle(ctx,51,51,6.5,ink);
    circle(ctx,69,43,2.4,white);
  },
  smoking(ctx){
    ctx.fillStyle=ink;
    ctx.fillRect(24,56,42,9);
    ctx.fillRect(69,56,6,9);
    line(ctx,[[69,51],[68,47],[62,44],[61,40],[65,36],[64,31]],ink,3.8);
    line(ctx,[[75,51],[75,45],[71,43],[70,39]],ink,3.4);
  },
};

export function drawSafetySign(ctx,width,height,kind){
  ctx.fillStyle=white;
  ctx.fillRect(0,0,width,height);
  ctx.save();
  const scale=Math.min(width,height)/100;
  ctx.translate((width-100*scale)/2,(height-100*scale)/2);
  ctx.scale(scale,scale);
  const prohibition=kind==="camera" || kind==="smoking";
  if(prohibition){
    symbols[kind](ctx);
    ctx.strokeStyle=red;
    ctx.lineWidth=8;
    ctx.beginPath();
    ctx.arc(50,50,40,0,2*Math.PI);
    ctx.stroke();
    line(ctx,[[22,22],[78,78]],red,8);
  }else{
    circle(ctx,50,50,45,blue);
    symbols[kind](ctx);
  }
  ctx.restore();
}
