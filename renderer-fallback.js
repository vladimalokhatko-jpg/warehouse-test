import * as THREE from "three";
import {receiving} from "./layout.js?v=10";

const light = new THREE.Vector3(-.52,.79,.34).normalize();
const vertex = new THREE.Vector3();
const transform = new THREE.Matrix4();

function boxFaces(w,h,d) {
  const x=w/2,y=h/2,z=d/2;
  return [
    [[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],
    [[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]],
    [[x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z]],
    [[-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z]],
    [[-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z]],
    [[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]],
  ];
}
function chamferedBox(width, height, depth, radius) {
  const outer = [width/2, height/2, depth/2];
  const inset = Math.min(radius*.78, ...outer.map(value => value*.8));
  const inner = outer.map(value=>value-inset);
  const points = [];
  function orient(face) {
    const first = new THREE.Vector3(...face[0]);
    const normal = new THREE.Vector3(...face[1]).sub(first)
      .cross(new THREE.Vector3(...face[2]).sub(first));
    return normal.dot(first) < 0 ? face.reverse() : face;
  }
  for (let axis=0;axis<3;axis++) {
    const a=(axis+1)%3,b=(axis+2)%3;
    for (const sign of [-1,1]) {
      points.push(orient([[-1,-1],[1,-1],[1,1],[-1,1]].map(([p,q])=>{
        const v=[0,0,0];
        v[axis]=sign*outer[axis]; v[a]=p*inner[a]; v[b]=q*inner[b];
        return v;
      })));
    }
  }
  for (let a=0;a<3;a++) for (let b=a+1;b<3;b++) {
    const axis=3-a-b;
    for (const p of [-1,1]) for (const q of [-1,1]) {
      const edge=(sign, onA)=>{
        const v=[0,0,0];
        v[a]=p*(onA?outer[a]:inner[a]); v[b]=q*(onA?inner[b]:outer[b]);
        v[axis]=sign*inner[axis];
        return v;
      };
      points.push(orient([edge(-1,true),edge(1,true),edge(1,false),edge(-1,false)]));
    }
  }
  for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
    points.push(orient([
      [x*outer[0],y*inner[1],z*inner[2]],
      [x*inner[0],y*outer[1],z*inner[2]],
      [x*inner[0],y*inner[1],z*outer[2]],
    ]));
  }
  return points;
}

function cylinderFaces(radius, height, segments = 16) {
  const ring = Array.from({ length:segments },(_,i) => {
    const angle = i * 2 * Math.PI / segments;
    return [radius * Math.cos(angle),radius * Math.sin(angle)];
  });
  const top = ring.map(([x,z])=>[x,height/2,z]);
  const bottom = ring.map(([x,z])=>[x,-height/2,z]);
  const faces = [top.slice().reverse(),bottom];
  for(let i=0;i<segments;i++){
    const j=(i+1)%segments;
    faces.push([bottom[i],top[i],top[j],bottom[j]]);
  }
  return faces;
}
const localCache = new WeakMap();
export function localFaces(geometry) {
  if(localCache.has(geometry)) return localCache.get(geometry);
  const params = geometry.parameters || {};
  let faces;
  if(geometry.type === "PlaneGeometry"){
    const x = params.width/2, y=params.height/2;
    faces = [[[-x,-y,0],[x,-y,0],[x,y,0],[-x,y,0]]];
  } else if (geometry.type === "RoundedBoxGeometry") {
    faces=chamferedBox(params.width,params.height,params.depth,params.radius);
  } else if(geometry.type === "CylinderGeometry"){
    faces=cylinderFaces((params.radiusTop+params.radiusBottom)/2,params.height);
  } else if(geometry.type === "SphereGeometry"){
    const r=params.radius;
    const top=[0,r,0],bottom=[0,-r*.68,0];
    const offsets=Array.from({length:8},(_,i)=>[r*Math.cos(i*Math.PI/4),0,r*Math.sin(i*Math.PI/4)]);
    faces=offsets.flatMap((v,i)=>[[v,top,offsets[(i+1)%8]],[v,offsets[(i+1)%8],bottom]]);
  } else if (geometry.type==="TorusGeometry"){
    const r=params.radius;
    faces=[];
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
      const outer=r+params.tube, inner=r-params.tube;
      faces.push([[inner*Math.cos(a),inner*Math.sin(a),0],[outer*Math.cos(a),outer*Math.sin(a),0],[outer*Math.cos(b),outer*Math.sin(b),0],[inner*Math.cos(b),inner*Math.sin(b),0]]);
    }
  } else {
    geometry.computeBoundingBox();
    const size=geometry.boundingBox.getSize(new THREE.Vector3());
    faces=boxFaces(size.x,size.y,size.z);
  }
  localCache.set(geometry,faces);
  return faces;
}

function tint(material, normal) {
  const color = new THREE.Color(material.userData.softwareColor ?? material.color);
  color.getRGB(color,THREE.SRGBColorSpace);
  const lambert = Math.max(0,normal.dot(light));
  const up = Math.max(0,normal.y);
  const direct = .79 + .16*lambert + .066*up;
  const warm = .042*lambert;
  const glow = Math.min(.20,(material.emissiveIntensity || 0)*.07);
  const channel = val => Math.min(255,Math.round(val));
  return "rgb(" + [
    channel(color.r*255*(direct+warm)+6+glow*90),
    channel(color.g*255*direct+10+glow*57),
    channel(color.b*255*(direct-warm*.23)+12+glow*25),
  ].join(",") + ")";
}

function boxFacePixelData(local, matrix, material, type, sortAnchor, layer) {
  const coords = local.map(coords => vertex.fromArray(coords).applyMatrix4(matrix).toArray());
  const a=new THREE.Vector3().fromArray(coords[0]), b=new THREE.Vector3().fromArray(coords[1]), c=new THREE.Vector3().fromArray(coords[2]);
  const normal=b.sub(a).cross(c.sub(a)).normalize();
  const center=coords.reduce((out,[x,y,z])=>{out.x+=x;out.y+=y;out.z+=z;return out;},new THREE.Vector3()).multiplyScalar(1/coords.length);
  const ink=tint(material,normal);
  const ySpread=Math.max(...coords.map(p=>p[1]))-Math.min(...coords.map(p=>p[1]));
  const yTop=Math.max(...coords.map(p=>p[1]));
  const isBasic = material.isMeshBasicMaterial;
  const texture=type==="PlaneGeometry" || (material.map && normal.x>.9) ? material.map?.image : null;
  const ground = center.y<.07 && ySpread<.07 && yTop<.1;
  const interior = center.y>=1.16 && center.y<1.28 && ySpread<.07 && yTop<1.30;
  const section = layer ?? (center.y<0 ? 0 : ground ? 1 : interior ? 2 : 3);
  return { coords, normal, center, ink, section, texture, material, isBasic, sortAnchor };
}
function trace(ctx,points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();
}
function imageTriangle(ctx,image,points,coords) {
  const [a,b,c]=points;
  const [[u0,v0],[u1,v1],[u2,v2]]=coords;
  const U1=u1-u0,V1=v1-v0,U2=u2-u0,V2=v2-v0;
  const det=U1*V2-U2*V1;
  if(Math.abs(det)<1e-6) return;
  const X1=b[0]-a[0],X2=c[0]-a[0],Y1=b[1]-a[1],Y2=c[1]-a[1];
  const aa=(X1*V2-X2*V1)/det,bb=(Y1*V2-Y2*V1)/det,cc=(X2*U1-X1*U2)/det,dd=(Y2*U1-Y1*U2)/det;
  ctx.save();
  trace(ctx,points);ctx.clip();
  ctx.transform(aa,bb,cc,dd,a[0]-aa*u0-cc*v0,a[1]-bb*u0-dd*v0);
  ctx.drawImage(image,0,0);
  ctx.restore();
}
function drawTextured(ctx, face, points) {
  const image=face.texture;
  const w=image.width,h=image.height;
  // Plane wrapping follows the bottom-left to top-left order used in localFaces.
  const uv=[[0,h],[w,h],[w,0],[0,0]];
  imageTriangle(ctx,image,[points[0],points[1],points[2]],[uv[0],uv[1],uv[2]]);
  imageTriangle(ctx,image,[points[0],points[2],points[3]],[uv[0],uv[2],uv[3]]);
}

export class SoftwareRenderer {
  constructor(canvas, dynamicRoots) {
    this.kind="canvas";
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d",{alpha:true});
    if(!this.ctx) throw new Error("2D canvas could not start");
    this.shadowMap={autoUpdate:false,needsUpdate:false};
    this.dpr=1;
    this.dynamicRoots=dynamicRoots;
    this.projection=new THREE.Matrix4();
    this.forward=new THREE.Vector3();
    this.staticFaces=null;
    this.dynamicNodes=[];
  }

  setPixelRatio(ratio){this.dpr=Math.min(1.5,ratio);}
  setSize(width,height){
    this.width=width;this.height=height;
    this.canvas.width=Math.round(width*this.dpr);
    this.canvas.height=Math.round(height*this.dpr);
  }

  splitTransforms(scene){
    this.staticFaces=[];
    scene.traverse(node=>{
      if(!node.isMesh || node.material.opacity===0 && !node.material.isMeshBasicMaterial) return;
      if(node.geometry.type==="PlaneGeometry" && node.position.y<-.6) return;
      let ancestor=node;
      let dynamic=false;
      while(ancestor){if(this.dynamicRoots.has(ancestor)){dynamic=true;break;}ancestor=ancestor.parent;}
      if (dynamic) this.dynamicNodes.push(node);
      else this.staticFaces.push(...this.facesFor(node));
    });
  }

  facesFor(node){
    const geometry=node.geometry;
    const local=localFaces(geometry);
    const mat=node.material;
    if(node.isInstancedMesh){
      const faces=[];
      for(let i=0;i<node.count;i++){
        node.getMatrixAt(i,transform);
        transform.premultiply(node.matrixWorld);
        faces.push(...local.map(points=>boxFacePixelData(points,transform,mat,geometry.type)));
      }
      return faces;
    }
    // Surface decals sort with their host face in the painter's algorithm.
    const sortAnchor=node.userData.canvasSortAnchor?.clone().applyMatrix4(node.parent.matrixWorld);
    return local.map(points=>boxFacePixelData(points,node.matrixWorld,mat,geometry.type,sortAnchor,node.userData.canvasLayer));
  }

  clip(coords){
    const m=this.projection.elements;
    const out=[];
    let intact=true;
    function signed([x,y,z]){return m[3]*x+m[7]*y+m[11]*z+m[15]-.25;}
    for(let i=0;i<coords.length;i++){
      const p=coords[i],q=coords[(i+1)%coords.length];
      const a=signed(p),b=signed(q);
      if(a>=0)out.push(p);
      else intact=false;
      if((a>=0)!==(b>=0)){
        const t=a/(a-b);
        out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t]);
      }
    }
    return {out,intact};
  }

  project(x,y,z){
    const m=this.projection.elements;
    const w=m[3]*x+m[7]*y+m[11]*z+m[15];
    return [
      (1+(m[0]*x+m[4]*y+m[8]*z+m[12])/w)*this.width/2,
      (1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*this.height/2,
    ];
  }

  castFloorShadows(){
    const ctx=this.ctx;
    const layouts=[
      ...receiving.docks.map(x=>[x,9.95,4.1,1.8,.24,1.225]),
      [-17.7,-21.2,10.35,4.20,.18,1.223],[.4,-21.0,20.5,3.6,.17,1.222],
    ];
    const m=this.projection.elements;
    const near = (x,z)=>m[3]*x+m[11]*z+m[15]>.6;
    ctx.save();
    ctx.filter="blur(5.2px)";
    for(const [x,z,w,d,alpha,y] of layouts){
      const coords=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
      if(!coords.every(([px,pz])=>near(px,pz)))continue;
      trace(ctx,coords.map(([px,pz])=>this.project(px,y,pz)));
      ctx.fillStyle="rgba(46,68,54,"+(alpha*.63)+")";
      ctx.fill();
    }
    ctx.restore();
  }

  render(scene,camera){
    const ctx=this.ctx;
    scene.updateMatrixWorld();
    if(!this.staticFaces)this.splitTransforms(scene);
    this.projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    camera.getWorldDirection(this.forward);
    const dx=this.forward.x,dy=this.forward.y,dz=this.forward.z;
    const x=camera.position.x,y=camera.position.y,z=camera.position.z;
    const buckets=[[],[],[],[]];
    const arrange=face=>{
      if(face.material.transparent && face.material.opacity<.003)return;
      const {normal,center,coords}=face;
      if(normal.x*(x-center.x)+normal.y*(y-center.y)+normal.z*(z-center.z) <= .0001)return;
      const {out,intact}=this.clip(coords);
      if(out.length<3)return;
      const points=out.map(v=>this.project(...v));
      if(points.every(p=>p[0]<0)||points.every(p=>p[0]>this.width)||points.every(p=>p[1]<0)||points.every(p=>p[1]>this.height))return;
      const sortCenter=face.sortAnchor ?? center;
      let depth=dx*sortCenter.x+dy*sortCenter.y+dz*sortCenter.z;
      let section=face.section;
      if(section===1 || section===2)depth=3-center.y;
      buckets[section].push({face,points,intact,depth});
    };
    this.staticFaces.forEach(arrange);
    for(const node of this.dynamicNodes)this.facesFor(node).forEach(arrange);
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,this.width,this.height);
    const platform=[[-31,-45],[28,-45],[28,18],[-31,18]];
    if(platform.every(([px,pz])=>this.projection.elements[3]*px+this.projection.elements[11]*pz+this.projection.elements[15]>1)){
      ctx.save();
      ctx.filter="blur(9px)";
      trace(ctx,platform.map(([px,pz])=>this.project(px+.20,-.62,pz+.34)));
      ctx.fillStyle="rgba(40,65,54,.23)";
      ctx.fill();
      ctx.restore();
    }
    for(let layer=0;layer<buckets.length;layer++){
      if(layer===3)this.castFloorShadows();
      buckets[layer].sort((a,b)=>b.depth-a.depth);
      for(const {face,points,intact} of buckets[layer]){
        const {material,texture,ink,isBasic}=face;
        ctx.globalAlpha=material.opacity;
        if(texture && intact && points.length===4 && (face.isBasic || face.normal.y>.9 || face.normal.x>.9)){
          drawTextured(ctx,face,points);
          continue;
        }
        trace(ctx,points);
        ctx.fillStyle=isBasic ? "#"+material.color.getHexString() : ink;
        ctx.fill();
        if(layer===3 && !material.transparent){
          ctx.lineWidth=.34;
          ctx.strokeStyle=ink;
          ctx.stroke();
        }
      }
      ctx.globalAlpha=1;
    }
  }
}
