import * as THREE from "three";
// Lightweight loader for local, static, uncompressed GLB 2.0 equipment.
export async function loadStaticGLB(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error("GLB HTTP "+response.status);
 const bytes=await response.arrayBuffer(),dv=new DataView(bytes);
 if(dv.byteLength<28||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==dv.byteLength)throw new Error("Invalid GLB 2.0 header");
 let json,bin=0,binSize=0;const decoder=new TextDecoder();
 for(let i=12;i<dv.byteLength;){
   const size=dv.getUint32(i,true),type=dv.getUint32(i+4,true);
   if(i+8+size>dv.byteLength)throw new Error("Corrupt GLB chunk");
   if(type===0x4e4f534a)json=JSON.parse(decoder.decode(new Uint8Array(bytes,i+8,size)));
   if(type===0x004e4942){bin=i+8;binSize=size}
   i+=8+size;
 }
 if(!json||!binSize)throw new Error("GLB missing scene data");
 function values(index){
   const a=json.accessors[index],view=json.bufferViews[a.bufferView];
   const count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
   const width=a.componentType===5126||a.componentType===5125?4:a.componentType===5123?2:a.componentType===5121?1:0;
   if(!count||!width||view.byteStride)throw new Error("Unsupported GLB accessor");
   const off=bin+(view.byteOffset||0)+(a.byteOffset||0);
   if(off+a.count*count*width>bin+binSize)throw new Error("GLB buffer overrun");
   const data=new DataView(bytes,off,a.count*count*width),out=[];
   for(let j=0;j<a.count*count;j++){
     const p=j*width;
     out.push(a.componentType===5126?data.getFloat32(p,true):a.componentType===5125?data.getUint32(p,true):a.componentType===5123?data.getUint16(p,true):data.getUint8(p));
   }
   return out;
 }
 const root=new THREE.Group();root.name="Industrial pallet jack | GLB";
 for(const def of json.meshes||[])for(const item of def.primitives){
   const geo=new THREE.BufferGeometry();
   geo.setAttribute("position",new THREE.Float32BufferAttribute(values(item.attributes.POSITION),3));
   if(item.attributes.NORMAL!==undefined)geo.setAttribute("normal",new THREE.Float32BufferAttribute(values(item.attributes.NORMAL),3));
   else geo.computeVertexNormals();
   if(item.indices!==undefined)geo.setIndex(values(item.indices));
   const mat=json.materials?.[item.material]||{},pbr=mat.pbrMetallicRoughness||{},rgba=pbr.baseColorFactor||[1,1,1,1];
   const material=new THREE.MeshStandardMaterial({
     name:mat.name||"GLB material",
     color:new THREE.Color().setRGB(rgba[0],rgba[1],rgba[2],THREE.LinearSRGBColorSpace),
     metalness:pbr.metallicFactor??0,roughness:pbr.roughnessFactor??1,
     side:mat.doubleSided?THREE.DoubleSide:THREE.FrontSide,
     opacity:rgba[3],transparent:rgba[3]<1
   });
   const mesh=new THREE.Mesh(geo,material);
   mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 }
 root.userData.assetType="glb";
 return root;
}
