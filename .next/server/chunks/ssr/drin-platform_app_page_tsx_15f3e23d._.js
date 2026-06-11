module.exports=[398156,a=>{"use strict";var b=a.i(688110),c=a.i(721586);let d=`#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;

uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform float u_pxSize;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_objectHelperBox;

out vec2 v_responsiveUV;
out vec2 v_responsiveBoxSize;
out vec2 v_responsiveHelperBox;
out vec2 v_responsiveBoxGivenSize;

out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_patternHelperBox;

out vec2 v_imageUV;

// #define ADD_HELPERS

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================
  // Sizing api for graphic objects with fixed ratio
  // (currently supports only ratio = 1)

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  #ifdef ADD_HELPERS
  v_objectHelperBox = uv;
  v_objectHelperBox *= objectWorldScale;
  v_objectHelperBox += boxOrigin * (objectWorldScale - 1.);
  #endif

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;


  // ===================================================


  // ===================================================
  // Sizing api for graphic objects with either givenBoxSize ratio or canvas ratio.
  // Full-screen mode available with u_worldWidth = u_worldHeight = 0

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  v_responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / v_responsiveBoxSize;

  #ifdef ADD_HELPERS
  v_responsiveHelperBox = uv;
  v_responsiveHelperBox *= responsiveBoxScale;
  v_responsiveHelperBox += boxOrigin * (responsiveBoxScale - 1.);
  #endif

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================


  // ===================================================
  // Sizing api for patterns
  // (treating graphics as a image u_worldWidth x u_worldHeight size)

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  #ifdef ADD_HELPERS
  v_patternHelperBox = uv;
  v_patternHelperBox *= patternBoxScale;
  v_patternHelperBox += boxOrigin * (patternBoxScale - 1.);
  #endif

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================


  // ===================================================
  // Sizing api for images

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  #ifdef ADD_HELPERS
  vec2 imageHelperBox = uv;
  imageHelperBox *= imageBoxScale;
  imageHelperBox += boxOrigin * (imageBoxScale - 1.);
  #endif

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;

  // ===================================================

}`,e=8294400;class f{parentElement;canvasElement;gl;program=null;uniformLocations={};fragmentShader;rafId=null;lastRenderTime=0;currentFrame=0;speed=0;currentSpeed=0;providedUniforms;hasBeenDisposed=!1;resolutionChanged=!0;textures=new Map;minPixelRatio;maxPixelCount;isSafari=(function(){let a=navigator.userAgent.toLowerCase();return a.includes("safari")&&!a.includes("chrome")&&!a.includes("android")})();uniformCache={};textureUnitMap=new Map;constructor(a,b,c,d,f=0,g=0,i=2,j=e){if(a instanceof HTMLElement)this.parentElement=a;else throw Error("Paper Shaders: parent element must be an HTMLElement");if(!document.querySelector("style[data-paper-shader]")){const a=document.createElement("style");a.innerHTML=h,a.setAttribute("data-paper-shader",""),document.head.prepend(a)}const k=document.createElement("canvas");this.canvasElement=k,this.parentElement.prepend(k),this.fragmentShader=b,this.providedUniforms=c,this.currentFrame=g,this.minPixelRatio=i,this.maxPixelCount=j;const l=k.getContext("webgl2",d);if(!l)throw Error("Paper Shaders: WebGL is not supported in this browser");this.gl=l,this.initProgram(),this.setupPositionAttribute(),this.setupUniforms(),this.setUniformValues(this.providedUniforms),this.setupResizeObserver(),visualViewport?.addEventListener("resize",this.handleVisualViewportChange),this.setSpeed(f),this.parentElement.setAttribute("data-paper-shader",""),this.parentElement.paperShaderMount=this,document.addEventListener("visibilitychange",this.handleDocumentVisibilityChange)}initProgram=()=>{let a=function(a,b,c){let d=a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT),e=d?d.precision:null;e&&e<23&&(b=b.replace(/precision\s+(lowp|mediump)\s+float;/g,"precision highp float;"),c=c.replace(/precision\s+(lowp|mediump)\s+float/g,"precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,"$1 highp $3"));let f=g(a,a.VERTEX_SHADER,b),h=g(a,a.FRAGMENT_SHADER,c);if(!f||!h)return null;let i=a.createProgram();return i?(a.attachShader(i,f),a.attachShader(i,h),a.linkProgram(i),a.getProgramParameter(i,a.LINK_STATUS))?(a.detachShader(i,f),a.detachShader(i,h),a.deleteShader(f),a.deleteShader(h),i):(console.error("Unable to initialize the shader program: "+a.getProgramInfoLog(i)),a.deleteProgram(i),a.deleteShader(f),a.deleteShader(h),null):null}(this.gl,d,this.fragmentShader);a&&(this.program=a)};setupPositionAttribute=()=>{let a=this.gl.getAttribLocation(this.program,"a_position"),b=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,b),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(a),this.gl.vertexAttribPointer(a,2,this.gl.FLOAT,!1,0,0)};setupUniforms=()=>{let a={u_time:this.gl.getUniformLocation(this.program,"u_time"),u_pixelRatio:this.gl.getUniformLocation(this.program,"u_pixelRatio"),u_resolution:this.gl.getUniformLocation(this.program,"u_resolution")};Object.entries(this.providedUniforms).forEach(([b,c])=>{if(a[b]=this.gl.getUniformLocation(this.program,b),c instanceof HTMLImageElement){let c=`${b}AspectRatio`;a[c]=this.gl.getUniformLocation(this.program,c)}}),this.uniformLocations=a};renderScale=1;parentWidth=0;parentHeight=0;parentDevicePixelWidth=0;parentDevicePixelHeight=0;devicePixelsSupported=!1;resizeObserver=null;setupResizeObserver=()=>{this.resizeObserver=new ResizeObserver(([a])=>{if(a?.borderBoxSize[0]){let b=a.devicePixelContentBoxSize?.[0];void 0!==b&&(this.devicePixelsSupported=!0,this.parentDevicePixelWidth=b.inlineSize,this.parentDevicePixelHeight=b.blockSize),this.parentWidth=a.borderBoxSize[0].inlineSize,this.parentHeight=a.borderBoxSize[0].blockSize}this.handleResize()}),this.resizeObserver.observe(this.parentElement)};handleVisualViewportChange=()=>{this.resizeObserver?.disconnect(),this.setupResizeObserver()};handleResize=()=>{let a=0,b=0,c=Math.max(1,window.devicePixelRatio),d=visualViewport?.scale??1;if(this.devicePixelsSupported){let e=Math.max(1,this.minPixelRatio/c);a=this.parentDevicePixelWidth*e*d,b=this.parentDevicePixelHeight*e*d}else{let e,f,g=Math.max(c,this.minPixelRatio)*d;this.isSafari&&(g*=Math.max(1,(f=Math.round(100*(e=outerWidth/((visualViewport?.scale??1)*(visualViewport?.width??window.innerWidth)+(window.innerWidth-document.documentElement.clientWidth)))))%5==0?f/100:33===f?1/3:67===f?2/3:133===f?4/3:e)),a=Math.round(this.parentWidth)*g,b=Math.round(this.parentHeight)*g}let e=Math.min(1,Math.sqrt(this.maxPixelCount)/Math.sqrt(a*b)),f=Math.round(a*e),g=Math.round(b*e),h=f/Math.round(this.parentWidth);(this.canvasElement.width!==f||this.canvasElement.height!==g||this.renderScale!==h)&&(this.renderScale=h,this.canvasElement.width=f,this.canvasElement.height=g,this.resolutionChanged=!0,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height),this.render(performance.now()))};render=a=>{if(this.hasBeenDisposed)return;if(null===this.program)return void console.warn("Tried to render before program or gl was initialized");let b=a-this.lastRenderTime;this.lastRenderTime=a,0!==this.currentSpeed&&(this.currentFrame+=b*this.currentSpeed),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.useProgram(this.program),this.gl.uniform1f(this.uniformLocations.u_time,.001*this.currentFrame),this.resolutionChanged&&(this.gl.uniform2f(this.uniformLocations.u_resolution,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.uniformLocations.u_pixelRatio,this.renderScale),this.resolutionChanged=!1),this.gl.drawArrays(this.gl.TRIANGLES,0,6),0!==this.currentSpeed?this.requestRender():this.rafId=null};requestRender=()=>{null!==this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=requestAnimationFrame(this.render)};setTextureUniform=(a,b)=>{if(!b.complete||0===b.naturalWidth)throw Error(`Paper Shaders: image for uniform ${a} must be fully loaded`);let c=this.textures.get(a);c&&this.gl.deleteTexture(c),this.textureUnitMap.has(a)||this.textureUnitMap.set(a,this.textureUnitMap.size);let d=this.textureUnitMap.get(a);this.gl.activeTexture(this.gl.TEXTURE0+d);let e=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,e),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,b);let f=this.gl.getError();if(f!==this.gl.NO_ERROR||null===e)return void console.error("Paper Shaders: WebGL error when uploading texture:",f);this.textures.set(a,e);let g=this.uniformLocations[a];if(g){this.gl.uniform1i(g,d);let c=`${a}AspectRatio`,e=this.uniformLocations[c];if(e){let a=b.naturalWidth/b.naturalHeight;this.gl.uniform1f(e,a)}}};areUniformValuesEqual=(a,b)=>a===b||!!(Array.isArray(a)&&Array.isArray(b))&&a.length===b.length&&a.every((a,c)=>this.areUniformValuesEqual(a,b[c]));setUniformValues=a=>{this.gl.useProgram(this.program),Object.entries(a).forEach(([a,b])=>{let c=b;if(b instanceof HTMLImageElement&&(c=`${b.src.slice(0,200)}|${b.naturalWidth}x${b.naturalHeight}`),this.areUniformValuesEqual(this.uniformCache[a],c))return;this.uniformCache[a]=c;let d=this.uniformLocations[a];if(!d)return void console.warn(`Uniform location for ${a} not found`);if(b instanceof HTMLImageElement)this.setTextureUniform(a,b);else if(Array.isArray(b)){let c=null,e=null;if(void 0!==b[0]&&Array.isArray(b[0])){let d=b[0].length;if(!b.every(a=>a.length===d))return void console.warn(`All child arrays must be the same length for ${a}`);c=b.flat(),e=d}else e=(c=b).length;switch(e){case 2:this.gl.uniform2fv(d,c);break;case 3:this.gl.uniform3fv(d,c);break;case 4:this.gl.uniform4fv(d,c);break;case 9:this.gl.uniformMatrix3fv(d,!1,c);break;case 16:this.gl.uniformMatrix4fv(d,!1,c);break;default:console.warn(`Unsupported uniform array length: ${e}`)}}else"number"==typeof b?this.gl.uniform1f(d,b):"boolean"==typeof b?this.gl.uniform1i(d,+!!b):console.warn(`Unsupported uniform type for ${a}: ${typeof b}`)})};getCurrentFrame=()=>this.currentFrame;setFrame=a=>{this.currentFrame=a,this.lastRenderTime=performance.now(),this.render(performance.now())};setSpeed=(a=1)=>{this.speed=a,this.setCurrentSpeed(document.hidden?0:a)};setCurrentSpeed=a=>{this.currentSpeed=a,null===this.rafId&&0!==a&&(this.lastRenderTime=performance.now(),this.rafId=requestAnimationFrame(this.render)),null!==this.rafId&&0===a&&(cancelAnimationFrame(this.rafId),this.rafId=null)};setMaxPixelCount=(a=e)=>{this.maxPixelCount=a,this.handleResize()};setMinPixelRatio=(a=2)=>{this.minPixelRatio=a,this.handleResize()};setUniforms=a=>{this.setUniformValues(a),this.providedUniforms={...this.providedUniforms,...a},this.render(performance.now())};handleDocumentVisibilityChange=()=>{this.setCurrentSpeed(document.hidden?0:this.speed)};dispose=()=>{this.hasBeenDisposed=!0,null!==this.rafId&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.gl&&this.program&&(this.textures.forEach(a=>{this.gl.deleteTexture(a)}),this.textures.clear(),this.gl.deleteProgram(this.program),this.program=null,this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.getError()),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),visualViewport?.removeEventListener("resize",this.handleVisualViewportChange),document.removeEventListener("visibilitychange",this.handleDocumentVisibilityChange),this.uniformLocations={},this.canvasElement.remove(),delete this.parentElement.paperShaderMount}}function g(a,b,c){let d=a.createShader(b);return d?(a.shaderSource(d,c),a.compileShader(d),a.getShaderParameter(d,a.COMPILE_STATUS))?d:(console.error("An error occurred compiling the shaders: "+a.getShaderInfoLog(d)),a.deleteShader(d),null):null}let h=`@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;async function i(a){let b={},c=[];return Object.entries(a).forEach(([a,d])=>{if("string"==typeof d){if(!d){b[a]=void console.warn("Paper Shaders: can’t create an image on the server");return}if(!(a=>{try{if(a.startsWith("/"))return!0;return new URL(a),!0}catch{return!1}})(d))return void console.warn(`Uniform "${a}" has invalid URL "${d}". Skipping image loading.`);let e=new Promise((c,e)=>{let f=new Image;(a=>{try{if(a.startsWith("/"))return!1;return new URL(a,window.location.origin).origin!==window.location.origin}catch{return!1}})(d)&&(f.crossOrigin="anonymous"),f.onload=()=>{b[a]=f,c()},f.onerror=()=>{console.error(`Could not set uniforms. Failed to load image at ${d}`),e()},f.src=d});c.push(e)}else b[a]=d}),await Promise.all(c),b}let j=(0,c.forwardRef)(function({fragmentShader:a,uniforms:d,webGlContextAttributes:e,speed:g=0,frame:h=0,width:j,height:k,minPixelRatio:l,maxPixelCount:m,style:n,...o},p){var q;let r,s,[t,u]=(0,c.useState)(!1),v=(0,c.useRef)(null),w=(0,c.useRef)(null),x=(0,c.useRef)(e);(0,c.useEffect)(()=>((async()=>{let b=await i(d);v.current&&!w.current&&(w.current=new f(v.current,a,b,x.current,g,h,l,m),u(!0))})(),()=>{w.current?.dispose(),w.current=null}),[a]),(0,c.useEffect)(()=>{let a=!1;return(async()=>{let b=await i(d);a||w.current?.setUniforms(b)})(),()=>{a=!0}},[d,t]),(0,c.useEffect)(()=>{w.current?.setSpeed(g)},[g,t]),(0,c.useEffect)(()=>{w.current?.setMaxPixelCount(m)},[m,t]),(0,c.useEffect)(()=>{w.current?.setMinPixelRatio(l)},[l,t]),(0,c.useEffect)(()=>{w.current?.setFrame(h)},[h,t]);let y=(q=[v,p],r=c.useRef(void 0),s=c.useCallback(a=>{let b=q.map(b=>{if(null!=b){if("function"==typeof b){let c=b(a);return"function"==typeof c?c:()=>{b(null)}}return b.current=a,()=>{b.current=null}}});return()=>{b.forEach(a=>a?.())}},q),c.useMemo(()=>q.every(a=>null==a)?null:a=>{r.current&&(r.current(),r.current=void 0),null!=a&&(r.current=s(a))},q));return(0,b.jsx)("div",{ref:y,style:void 0!==j||void 0!==k?{width:j,height:k,...n}:n,...o})});j.displayName="ShaderMount";let k=`
in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_patternUV;
in vec2 v_imageUV;`,l=`
in vec2 v_objectBoxSize;
in vec2 v_objectHelperBox;
in vec2 v_responsiveBoxSize;
in vec2 v_responsiveHelperBox;
in vec2 v_patternBoxSize;
in vec2 v_patternHelperBox;`,m=`
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;`,n={fit:"contain",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},o={none:0,contain:1,cover:2};function p(a){if(Array.isArray(a))return 4===a.length?a:3===a.length?[...a,1]:r;if("string"!=typeof a)return r;let b,c,d,e=1;if(a.startsWith("#")){var f;[b,c,d,e]=(3===(f=(f=a).replace(/^#/,"")).length&&(f=f.split("").map(a=>a+a).join("")),6===f.length&&(f+="ff"),[parseInt(f.slice(0,2),16)/255,parseInt(f.slice(2,4),16)/255,parseInt(f.slice(4,6),16)/255,parseInt(f.slice(6,8),16)/255])}else if(a.startsWith("rgb")){let f;[b,c,d,e]=(f=a.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(f[1]??"0")/255,parseInt(f[2]??"0")/255,parseInt(f[3]??"0")/255,void 0===f[4]?1:parseFloat(f[4])]:[0,0,0,1]}else{let f;if(!a.startsWith("hsl"))return console.error("Unsupported color format",a),r;[b,c,d,e]=function(a){let b,c,d,[e,f,g,h]=a,i=e/360,j=f/100,k=g/100;if(0===f)b=c=d=k;else{let a=(a,b,c)=>(c<0&&(c+=1),c>1&&(c-=1),c<1/6)?a+(b-a)*6*c:c<.5?b:c<2/3?a+(b-a)*(2/3-c)*6:a,e=k<.5?k*(1+j):k+j-k*j,f=2*k-e;b=a(f,e,i+1/3),c=a(f,e,i),d=a(f,e,i-1/3)}return[b,c,d,h]}((f=a.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(f[1]??"0"),parseInt(f[2]??"0"),parseInt(f[3]??"0"),void 0===f[4]?1:parseFloat(f[4])]:[0,0,0,1])}return[q(b,0,1),q(c,0,1),q(d,0,1),q(e,0,1)]}let q=(a,b,c)=>Math.min(Math.max(a,b),c),r=[0,0,0,1],s=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,t=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,u=`
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`,v=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[10];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

${k}
${l}
${m}

out vec4 fragColor;

${s}
${t}
${u}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float noise(vec2 n, vec2 seedOffset) {
  return valueNoise(n + seedOffset);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + mod(float(i), 3.) * .3;
  float c = .8 + mod(float(i + 1), 4.) * 0.25;

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 shape_uv = v_objectUV;
  shape_uv += .5;

  vec2 grainUV = v_objectUV;
  // apply inverse transform to grain_uv so it respects the originXY
  float grainUVRot = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(grainUVRot), sin(grainUVRot), -sin(grainUVRot), cos(grainUVRot));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);
  grainUV = transpose(graphicRotation) * grainUV;
  grainUV *= u_scale;
  grainUV *= .7;
  grainUV -= graphicOffset;
  grainUV *= v_objectBoxSize;
  
  float grain = noise(grainUV, vec2(0.));
  float mixerGrain = .4 * u_grainMixer * (grain - .5);

  const float firstFrameOffset = 41.5;
  float t = .5 * (u_time + firstFrameOffset);

  float radius = smoothstep(0., 1., length(shape_uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    shape_uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., shape_uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., shape_uv.y));
    shape_uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., shape_uv.x));
  }

  vec2 uvRotated = shape_uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < 10; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= totalWeight;
  opacity /= totalWeight;

  float rr = noise(rotate(grainUV, 1.), vec2(3.));
  float gg = noise(rotate(grainUV, 2.) + 10., vec2(-1.));
  float bb = noise(grainUV - 2., vec2(5.));
  vec3 grainColor = vec3(rr, gg, bb);
  color = mix(color, grainColor, .01 + .3 * u_grainOverlay);
  
  fragColor = vec4(color, opacity);
}
`,w={name:"Default",params:{...n,speed:1,frame:0,colors:["#e0eaff","#241d9a","#f75092","#9f50d3"],distortion:.8,swirl:.1,grainMixer:0,grainOverlay:0}},x=(0,c.memo)(function({speed:a=w.params.speed,frame:c=w.params.frame,colors:d=w.params.colors,distortion:e=w.params.distortion,swirl:f=w.params.swirl,grainMixer:g=w.params.grainMixer,grainOverlay:h=w.params.grainOverlay,fit:i=w.params.fit,rotation:k=w.params.rotation,scale:l=w.params.scale,originX:m=w.params.originX,originY:n=w.params.originY,offsetX:q=w.params.offsetX,offsetY:r=w.params.offsetY,worldWidth:s=w.params.worldWidth,worldHeight:t=w.params.worldHeight,...u}){let x={u_colors:d.map(p),u_colorsCount:d.length,u_distortion:e,u_swirl:f,u_grainMixer:g,u_grainOverlay:h,u_fit:o[i],u_rotation:k,u_scale:l,u_offsetX:q,u_offsetY:r,u_originX:m,u_originY:n,u_worldWidth:s,u_worldHeight:t};return(0,b.jsx)(j,{...u,speed:a,frame:c,fragmentShader:v,uniforms:x})},function(a,b){for(let c in a){if("colors"===c){let c=Array.isArray(a.colors),d=Array.isArray(b.colors);if(!c||!d){if(!1===Object.is(a.colors,b.colors))return!1;continue}if(a.colors?.length!==b.colors?.length||!a.colors?.every((a,c)=>a===b.colors?.[c]))return!1;continue}if(!1===Object.is(a[c],b[c]))return!1}return!0});function y(){let[a]=(0,c.useState)(.5);return(0,b.jsxs)("div",{className:"w-full h-full absolute inset-0",children:[(0,b.jsx)(x,{className:"w-full h-full",colors:["#000000","#001F05","#141415","#333333"],speed:a}),(0,b.jsxs)("div",{className:"absolute inset-0 pointer-events-none",children:[(0,b.jsx)("div",{className:"absolute top-1/4 left-1/3 w-32 h-32 bg-[#001F05]/10 rounded-full blur-3xl animate-pulse"}),(0,b.jsx)("div",{className:"absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#141415]/5 rounded-full blur-2xl animate-pulse"}),(0,b.jsx)("div",{className:"absolute top-1/2 right-1/3 w-20 h-20 bg-[#001F05]/8 rounded-full blur-xl animate-pulse"})]})]})}var z=a.i(276879),A=a.i(627927),B=a.i(61261),C=a.i(267564);function D(){let a=(0,B.useUser)({or:"return-null"}),d=(0,C.useRouter)();return((0,c.useEffect)(()=>{a&&d.push("/dashboard")},[a,d]),a)?(0,b.jsxs)("div",{className:"relative min-h-screen bg-black overflow-hidden",children:[(0,b.jsx)(y,{}),(0,b.jsx)("div",{className:"relative z-10 flex items-center justify-center min-h-screen",children:(0,b.jsx)("div",{className:"text-white",children:"Redirecionando..."})})]}):(0,b.jsxs)("div",{className:"relative min-h-screen bg-black overflow-hidden",children:[(0,b.jsx)(y,{}),(0,b.jsx)("div",{className:"relative z-10 flex flex-col items-center justify-center min-h-screen px-4",children:(0,b.jsxs)("div",{className:"text-center space-y-8 max-w-3xl mx-auto",children:[(0,b.jsx)("h1",{className:"text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight",children:"Um novo universo para o seu negocio comeca aqui"}),(0,b.jsxs)("div",{className:"pt-6 flex justify-center gap-4",children:[(0,b.jsx)(A.default,{href:"/auth/login",children:(0,b.jsx)(z.Button,{size:"lg",className:"bg-[#001F05] hover:bg-[#001F05]/80 text-white px-12 py-4 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg border border-[#001F05]/20",children:"Entrar"})}),(0,b.jsx)(A.default,{href:"/auth/register",children:(0,b.jsx)(z.Button,{size:"lg",variant:"outline",className:"border-[#001F05]/50 text-white hover:bg-[#001F05]/20 px-12 py-4 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg",children:"Cadastrar"})})]})]})})]})}a.s(["default",()=>D],398156)}];

//# sourceMappingURL=drin-platform_app_page_tsx_15f3e23d._.js.map