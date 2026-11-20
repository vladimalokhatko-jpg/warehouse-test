import * as THREE from "three";
import {floor,presets,fitWarehouse} from "./layout.js?v=21";
import {makeWarehouse} from "./scene.js?v=21";

const byId=id=>document.getElementById(id);
const stage=byId("stage"),canvas=byId("warehouse");
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

async function run(){
  await Promise.all([document.fonts.load("800 24px Inter","СКЛАД"),document.fonts.load("800 24px Inter","WAREHOUSE")]);
  const {scene,renderer}=makeWarehouse(canvas);
  const camera=new THREE.PerspectiveCamera(43,1,.05,900);
  const pose={...presets.overall,distance:110};
  const target=new THREE.Vector3();
  const ray=new THREE.Raycaster();
  const cursor=new THREE.Vector2();
  const ground=new THREE.Plane(new THREE.Vector3(0,1,0),-floor);
  const pointers=new Map();
  let width=1,height=1,frame=0,fit=true;

  function updateCamera(){
    const aspect=width/height;
    if(fit)pose.distance=fitWarehouse(pose,aspect);
    const horizontal=pose.distance*Math.cos(pose.el);
    target.set(pose.x,pose.y,pose.z);
    camera.position.set(pose.x+Math.sin(pose.az)*horizontal,pose.y+Math.sin(pose.el)*pose.distance,pose.z+Math.cos(pose.az)*horizontal);
    camera.aspect=aspect;
    camera.fov=pose.fov;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  function render(){
    frame=0;
    updateCamera();
    renderer.render(scene,camera);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  function startNavigation(){updateCamera();fit=false;}
  function setRay(clientX,clientY){
    updateCamera();
    const rect=canvas.getBoundingClientRect();
    cursor.set((clientX-rect.left)*2/rect.width-1,1-(clientY-rect.top)*2/rect.height);
    ray.setFromCamera(cursor,camera);
  }
  function pointOnGround(clientX,clientY){
    setRay(clientX,clientY);
    const point=ray.ray.intersectPlane(ground,new THREE.Vector3());
    return point && point.distanceTo(target)<500 ? point : undefined;
  }
  function zoom(factor,clientX,clientY){
    startNavigation();
    const anchor=clientX===undefined ? undefined : pointOnGround(clientX,clientY);
    const next=clamp(pose.distance*factor,1.3,350);
    const ratio=next/pose.distance;
    if(anchor){
      pose.x+=(anchor.x-pose.x)*(1-ratio);
      pose.z+=(anchor.z-pose.z)*(1-ratio);
    }
    pose.distance=next;
    schedule();
  }
  function pan(dx,dy){
    startNavigation();
    const scale=2*pose.distance*Math.tan(pose.fov*Math.PI/360)/height;
    const along=dy*scale/Math.max(Math.sin(pose.el),.30);
    pose.x-=Math.cos(pose.az)*dx*scale+Math.sin(pose.az)*along;
    pose.z+=Math.sin(pose.az)*dx*scale-Math.cos(pose.az)*along;
    schedule();
  }
  function rotate(dx,dy){
    startNavigation();
    pose.az-=dx*.006;
    pose.el=clamp(pose.el+dy*.005,.045,Math.PI/2-.005);
    schedule();
  }
  function reset(){
    Object.assign(pose,presets.overall);
    fit=true;
    schedule();
  }
  function viewInbound(){
    Object.assign(pose,{x:-2.60,y:floor+1.40,z:-4.45,az:.10,el:1.13,distance:46.0,fov:43});
    fit=false;
    schedule();
  }
  function viewHuddle(){
    Object.assign(pose,{x:-25.12,y:floor+1.15,z:-1.66,az:Math.PI-.12,el:.56,distance:10.2,fov:43});
    fit=false;
    schedule();
  }
  function viewReachTruck(){
    Object.assign(pose,{x:19.32,y:floor+1.18,z:7.46,az:1.02,el:.61,distance:10.2,fov:43});
    fit=false;
    schedule();
  }
  function viewPalletJacks(){
    Object.assign(pose,{x:-21.00,y:floor+.62,z:7.70,az:.33,el:.56,distance:8.9,fov:43});
    fit=false;
    schedule();
  }
  function gesture(){
    const [a,b]=Array.from(pointers.values());
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
  }

  canvas.addEventListener("contextmenu",event=>event.preventDefault());
  canvas.addEventListener("pointerdown",event=>{
    if(event.pointerType==="mouse" && ![0,1,2].includes(event.button))return;
    event.preventDefault();
    canvas.focus({preventScroll:true});
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button!==0||event.shiftKey});
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("navigating");
  });
  canvas.addEventListener("pointermove",event=>{
    const previous=pointers.get(event.pointerId);
    if(!previous)return;
    const before=pointers.size===2 ? gesture() : undefined;
    const dx=event.clientX-previous.x,dy=event.clientY-previous.y;
    pointers.set(event.pointerId,{...previous,x:event.clientX,y:event.clientY});
    if(before){
      const after=gesture();
      pan(after.x-before.x,after.y-before.y);
      zoom(before.distance/after.distance,after.x,after.y);
    }else if(pointers.size===1){
      if(previous.pan||event.shiftKey)pan(dx,dy);
      else rotate(dx,dy);
    }
  });
  function release(event){
    pointers.delete(event.pointerId);
    if(!pointers.size)canvas.classList.remove("navigating");
  }
  canvas.addEventListener("pointerup",release);
  canvas.addEventListener("pointercancel",release);
  canvas.addEventListener("lostpointercapture",release);
  canvas.addEventListener("wheel",event=>{
    event.preventDefault();
    const multiplier=event.deltaMode===1 ? 16 : event.deltaMode===2 ? height : 1;
    zoom(Math.exp(clamp(event.deltaY*multiplier,-180,180)*.0025),event.clientX,event.clientY);
  },{passive:false});
  canvas.addEventListener("dblclick",event=>{
    event.preventDefault();
    startNavigation();
    setRay(event.clientX,event.clientY);
    const hit=ray.intersectObjects(scene.children,true).find(hit=>hit.object.material?.opacity>.9 && hit.object.geometry.type!=="PlaneGeometry");
    const point=hit?.point ?? pointOnGround(event.clientX,event.clientY);
    if(!point)return;
    pose.x=point.x;pose.z=point.z;
    pose.y=clamp(point.y,floor+.2,floor+3.5);
    pose.distance=Math.min(pose.distance,9);
    schedule();
  });
  canvas.addEventListener("keydown",event=>{
    switch(event.key){
      case "ArrowLeft":pan(55,0);break;
      case "ArrowRight":pan(-55,0);break;
      case "ArrowUp":pan(0,55);break;
      case "ArrowDown":pan(0,-55);break;
      case "+":case "=":zoom(.84);break;
      case "-":zoom(1/.84);break;
      case "Home":reset();break;
      default:return;
    }
    event.preventDefault();
  });
  byId("out").addEventListener("click",()=>zoom(1/.80));
  byId("in").addEventListener("click",()=>zoom(.80));
  byId("reset").addEventListener("click",reset);
  byId("jack").addEventListener("click",viewPalletJacks);
  byId("reach").addEventListener("click",viewReachTruck);
  byId("huddle").addEventListener("click",viewHuddle);
  byId("inbound").addEventListener("click",viewInbound);
  byId("full").hidden=!stage.requestFullscreen;
  byId("full").addEventListener("click",()=>{
    const operation=document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen();
    operation.catch(()=>{byId("error").textContent="Полноэкранный режим доступен через меню браузера.";byId("error").hidden=false;});
  });
  new ResizeObserver(()=>{
    width=Math.max(stage.clientWidth,1);height=Math.max(stage.clientHeight,1);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,1920/width));
    renderer.setSize(width,height,false);
    schedule();
  }).observe(stage);
}
run().catch(error=>{console.error(error);byId("error").hidden=false;});
