(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,600134,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return i}});let i=e=>{}},371661,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return o}});let i=e.r(441230);function o(e,t){let r=(0,i.useRef)(null),o=(0,i.useRef)(null);return(0,i.useCallback)(i=>{if(null===i){let e=r.current;e&&(r.current=null,e());let t=o.current;t&&(o.current=null,t())}else e&&(r.current=n(e,i)),t&&(o.current=n(t,i))},[e,t])}function n(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},687558,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={assign:function(){return l},searchParamsToUrlQuery:function(){return n},urlQueryToSearchParams:function(){return s}};for(var o in i)Object.defineProperty(r,o,{enumerable:!0,get:i[o]});function n(e){let t={};for(let[r,i]of e.entries()){let e=t[r];void 0===e?t[r]=i:Array.isArray(e)?e.push(i):t[r]=[e,i]}return t}function a(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function s(e){let t=new URLSearchParams;for(let[r,i]of Object.entries(e))if(Array.isArray(i))for(let e of i)t.append(r,a(e));else t.set(r,a(i));return t}function l(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,i]of r.entries())e.append(t,i)}return e}},351184,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={formatUrl:function(){return s},formatWithValidation:function(){return u},urlObjectKeys:function(){return l}};for(var o in i)Object.defineProperty(r,o,{enumerable:!0,get:i[o]});let n=e.r(614e3)._(e.r(687558)),a=/https?|ftp|gopher|file/;function s(e){let{auth:t,hostname:r}=e,i=e.protocol||"",o=e.pathname||"",s=e.hash||"",l=e.query||"",u=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?u=t+e.host:r&&(u=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(u+=":"+e.port)),l&&"object"==typeof l&&(l=String(n.urlQueryToSearchParams(l)));let c=e.search||l&&`?${l}`||"";return i&&!i.endsWith(":")&&(i+=":"),e.slashes||(!i||a.test(i))&&!1!==u?(u="//"+(u||""),o&&"/"!==o[0]&&(o="/"+o)):u||(u=""),s&&"#"!==s[0]&&(s="#"+s),c&&"?"!==c[0]&&(c="?"+c),o=o.replace(/[?#]/g,encodeURIComponent),c=c.replace("#","%23"),`${i}${u}${o}${c}${s}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function u(e){return s(e)}},532990,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={DecodeError:function(){return m},MiddlewareNotFoundError:function(){return y},MissingStaticPage:function(){return b},NormalizeError:function(){return x},PageNotFoundError:function(){return _},SP:function(){return g},ST:function(){return v},WEB_VITALS:function(){return n},execOnce:function(){return a},getDisplayName:function(){return f},getLocationOrigin:function(){return u},getURL:function(){return c},isAbsoluteUrl:function(){return l},isResSent:function(){return h},loadGetInitialProps:function(){return p},normalizeRepeatedSlashes:function(){return d},stringifyError:function(){return S}};for(var o in i)Object.defineProperty(r,o,{enumerable:!0,get:i[o]});let n=["CLS","FCP","FID","INP","LCP","TTFB"];function a(e){let t,r=!1;return(...i)=>(r||(r=!0,t=e(...i)),t)}let s=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>s.test(e);function u(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function c(){let{href:e}=window.location,t=u();return e.substring(t.length)}function f(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function h(e){return e.finished||e.headersSent}function d(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function p(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await p(t.Component,t.ctx)}:{};let i=await e.getInitialProps(t);if(r&&h(r))return i;if(!i)throw Object.defineProperty(Error(`"${f(e)}.getInitialProps()" should resolve to an object. But found "${i}" instead.`),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return i}let g="undefined"!=typeof performance,v=g&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class m extends Error{}class x extends Error{}class _ extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class b extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class y extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function S(e){return JSON.stringify({message:e.message,stack:e.stack})}},884905,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return n}});let i=e.r(532990),o=e.r(986834);function n(e){if(!(0,i.isAbsoluteUrl)(e))return!0;try{let t=(0,i.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,o.hasBasePath)(r.pathname)}catch(e){return!1}}},589209,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return i}});let i=e=>{}},538226,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={default:function(){return m},useLinkStatus:function(){return _}};for(var o in i)Object.defineProperty(r,o,{enumerable:!0,get:i[o]});let n=e.r(614e3),a=e.r(485690),s=n._(e.r(441230)),l=e.r(351184),u=e.r(697707),c=e.r(371661),f=e.r(532990),h=e.r(353888);e.r(600134);let d=e.r(121090),p=e.r(884905),g=e.r(438881);function v(e){return"string"==typeof e?e:(0,l.formatUrl)(e)}function m(t){var r;let i,o,n,[l,m]=(0,s.useOptimistic)(d.IDLE_LINK_STATUS),_=(0,s.useRef)(null),{href:b,as:y,children:S,prefetch:R=null,passHref:E,replace:U,shallow:w,scroll:B,onClick:A,onMouseEnter:P,onTouchStart:z,legacyBehavior:O=!1,onNavigate:j,ref:T,unstable_dynamicOnHover:V,...M}=t;i=S,O&&("string"==typeof i||"number"==typeof i)&&(i=(0,a.jsx)("a",{children:i}));let L=s.default.useContext(u.AppRouterContext),F=!1!==R,C=!1!==R?null===(r=R)||"auto"===r?g.FetchStrategy.PPR:g.FetchStrategy.Full:g.FetchStrategy.PPR,{href:I,as:N}=s.default.useMemo(()=>{let e=v(b);return{href:e,as:y?v(y):e}},[b,y]);if(O){if(i?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});o=s.default.Children.only(i)}let D=O?o&&"object"==typeof o&&o.ref:T,H=s.default.useCallback(e=>(null!==L&&(_.current=(0,d.mountLinkInstance)(e,I,L,C,F,m)),()=>{_.current&&((0,d.unmountLinkForCurrentNavigation)(_.current),_.current=null),(0,d.unmountPrefetchableInstance)(e)}),[F,I,L,C,m]),W={ref:(0,c.useMergedRef)(H,D),onClick(t){O||"function"!=typeof A||A(t),O&&o.props&&"function"==typeof o.props.onClick&&o.props.onClick(t),!L||t.defaultPrevented||function(t,r,i,o,n,a,l){if("undefined"!=typeof window){let u,{nodeName:c}=t.currentTarget;if("A"===c.toUpperCase()&&((u=t.currentTarget.getAttribute("target"))&&"_self"!==u||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,p.isLocalURL)(r)){n&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:f}=e.r(336056);s.default.startTransition(()=>{f(i||r,n?"replace":"push",a??!0,o.current)})}}(t,I,N,_,U,B,j)},onMouseEnter(e){O||"function"!=typeof P||P(e),O&&o.props&&"function"==typeof o.props.onMouseEnter&&o.props.onMouseEnter(e),L&&F&&(0,d.onNavigationIntent)(e.currentTarget,!0===V)},onTouchStart:function(e){O||"function"!=typeof z||z(e),O&&o.props&&"function"==typeof o.props.onTouchStart&&o.props.onTouchStart(e),L&&F&&(0,d.onNavigationIntent)(e.currentTarget,!0===V)}};return(0,f.isAbsoluteUrl)(N)?W.href=N:O&&!E&&("a"!==o.type||"href"in o.props)||(W.href=(0,h.addBasePath)(N)),n=O?s.default.cloneElement(o,W):(0,a.jsx)("a",{...M,...W,children:i}),(0,a.jsx)(x.Provider,{value:l,children:n})}e.r(589209);let x=(0,s.createContext)(d.IDLE_LINK_STATUS),_=()=>(0,s.useContext)(x);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},202700,e=>{"use strict";var t=e.i(485690),r=e.i(441230);let i=`#version 300 es
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

}`,o=8294400;class n{parentElement;canvasElement;gl;program=null;uniformLocations={};fragmentShader;rafId=null;lastRenderTime=0;currentFrame=0;speed=0;currentSpeed=0;providedUniforms;hasBeenDisposed=!1;resolutionChanged=!0;textures=new Map;minPixelRatio;maxPixelCount;isSafari=(function(){let e=navigator.userAgent.toLowerCase();return e.includes("safari")&&!e.includes("chrome")&&!e.includes("android")})();uniformCache={};textureUnitMap=new Map;constructor(e,t,r,i,n=0,a=0,l=2,u=o){if(e instanceof HTMLElement)this.parentElement=e;else throw Error("Paper Shaders: parent element must be an HTMLElement");if(!document.querySelector("style[data-paper-shader]")){const e=document.createElement("style");e.innerHTML=s,e.setAttribute("data-paper-shader",""),document.head.prepend(e)}const c=document.createElement("canvas");this.canvasElement=c,this.parentElement.prepend(c),this.fragmentShader=t,this.providedUniforms=r,this.currentFrame=a,this.minPixelRatio=l,this.maxPixelCount=u;const f=c.getContext("webgl2",i);if(!f)throw Error("Paper Shaders: WebGL is not supported in this browser");this.gl=f,this.initProgram(),this.setupPositionAttribute(),this.setupUniforms(),this.setUniformValues(this.providedUniforms),this.setupResizeObserver(),visualViewport?.addEventListener("resize",this.handleVisualViewportChange),this.setSpeed(n),this.parentElement.setAttribute("data-paper-shader",""),this.parentElement.paperShaderMount=this,document.addEventListener("visibilitychange",this.handleDocumentVisibilityChange)}initProgram=()=>{let e=function(e,t,r){let i=e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT),o=i?i.precision:null;o&&o<23&&(t=t.replace(/precision\s+(lowp|mediump)\s+float;/g,"precision highp float;"),r=r.replace(/precision\s+(lowp|mediump)\s+float/g,"precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,"$1 highp $3"));let n=a(e,e.VERTEX_SHADER,t),s=a(e,e.FRAGMENT_SHADER,r);if(!n||!s)return null;let l=e.createProgram();return l?(e.attachShader(l,n),e.attachShader(l,s),e.linkProgram(l),e.getProgramParameter(l,e.LINK_STATUS))?(e.detachShader(l,n),e.detachShader(l,s),e.deleteShader(n),e.deleteShader(s),l):(console.error("Unable to initialize the shader program: "+e.getProgramInfoLog(l)),e.deleteProgram(l),e.deleteShader(n),e.deleteShader(s),null):null}(this.gl,i,this.fragmentShader);e&&(this.program=e)};setupPositionAttribute=()=>{let e=this.gl.getAttribLocation(this.program,"a_position"),t=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(e),this.gl.vertexAttribPointer(e,2,this.gl.FLOAT,!1,0,0)};setupUniforms=()=>{let e={u_time:this.gl.getUniformLocation(this.program,"u_time"),u_pixelRatio:this.gl.getUniformLocation(this.program,"u_pixelRatio"),u_resolution:this.gl.getUniformLocation(this.program,"u_resolution")};Object.entries(this.providedUniforms).forEach(([t,r])=>{if(e[t]=this.gl.getUniformLocation(this.program,t),r instanceof HTMLImageElement){let r=`${t}AspectRatio`;e[r]=this.gl.getUniformLocation(this.program,r)}}),this.uniformLocations=e};renderScale=1;parentWidth=0;parentHeight=0;parentDevicePixelWidth=0;parentDevicePixelHeight=0;devicePixelsSupported=!1;resizeObserver=null;setupResizeObserver=()=>{this.resizeObserver=new ResizeObserver(([e])=>{if(e?.borderBoxSize[0]){let t=e.devicePixelContentBoxSize?.[0];void 0!==t&&(this.devicePixelsSupported=!0,this.parentDevicePixelWidth=t.inlineSize,this.parentDevicePixelHeight=t.blockSize),this.parentWidth=e.borderBoxSize[0].inlineSize,this.parentHeight=e.borderBoxSize[0].blockSize}this.handleResize()}),this.resizeObserver.observe(this.parentElement)};handleVisualViewportChange=()=>{this.resizeObserver?.disconnect(),this.setupResizeObserver()};handleResize=()=>{let e=0,t=0,r=Math.max(1,window.devicePixelRatio),i=visualViewport?.scale??1;if(this.devicePixelsSupported){let o=Math.max(1,this.minPixelRatio/r);e=this.parentDevicePixelWidth*o*i,t=this.parentDevicePixelHeight*o*i}else{let o,n,a=Math.max(r,this.minPixelRatio)*i;this.isSafari&&(a*=Math.max(1,(n=Math.round(100*(o=outerWidth/((visualViewport?.scale??1)*(visualViewport?.width??window.innerWidth)+(window.innerWidth-document.documentElement.clientWidth)))))%5==0?n/100:33===n?1/3:67===n?2/3:133===n?4/3:o)),e=Math.round(this.parentWidth)*a,t=Math.round(this.parentHeight)*a}let o=Math.min(1,Math.sqrt(this.maxPixelCount)/Math.sqrt(e*t)),n=Math.round(e*o),a=Math.round(t*o),s=n/Math.round(this.parentWidth);(this.canvasElement.width!==n||this.canvasElement.height!==a||this.renderScale!==s)&&(this.renderScale=s,this.canvasElement.width=n,this.canvasElement.height=a,this.resolutionChanged=!0,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height),this.render(performance.now()))};render=e=>{if(this.hasBeenDisposed)return;if(null===this.program)return void console.warn("Tried to render before program or gl was initialized");let t=e-this.lastRenderTime;this.lastRenderTime=e,0!==this.currentSpeed&&(this.currentFrame+=t*this.currentSpeed),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.useProgram(this.program),this.gl.uniform1f(this.uniformLocations.u_time,.001*this.currentFrame),this.resolutionChanged&&(this.gl.uniform2f(this.uniformLocations.u_resolution,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.uniformLocations.u_pixelRatio,this.renderScale),this.resolutionChanged=!1),this.gl.drawArrays(this.gl.TRIANGLES,0,6),0!==this.currentSpeed?this.requestRender():this.rafId=null};requestRender=()=>{null!==this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=requestAnimationFrame(this.render)};setTextureUniform=(e,t)=>{if(!t.complete||0===t.naturalWidth)throw Error(`Paper Shaders: image for uniform ${e} must be fully loaded`);let r=this.textures.get(e);r&&this.gl.deleteTexture(r),this.textureUnitMap.has(e)||this.textureUnitMap.set(e,this.textureUnitMap.size);let i=this.textureUnitMap.get(e);this.gl.activeTexture(this.gl.TEXTURE0+i);let o=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,o),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,t);let n=this.gl.getError();if(n!==this.gl.NO_ERROR||null===o)return void console.error("Paper Shaders: WebGL error when uploading texture:",n);this.textures.set(e,o);let a=this.uniformLocations[e];if(a){this.gl.uniform1i(a,i);let r=`${e}AspectRatio`,o=this.uniformLocations[r];if(o){let e=t.naturalWidth/t.naturalHeight;this.gl.uniform1f(o,e)}}};areUniformValuesEqual=(e,t)=>e===t||!!(Array.isArray(e)&&Array.isArray(t))&&e.length===t.length&&e.every((e,r)=>this.areUniformValuesEqual(e,t[r]));setUniformValues=e=>{this.gl.useProgram(this.program),Object.entries(e).forEach(([e,t])=>{let r=t;if(t instanceof HTMLImageElement&&(r=`${t.src.slice(0,200)}|${t.naturalWidth}x${t.naturalHeight}`),this.areUniformValuesEqual(this.uniformCache[e],r))return;this.uniformCache[e]=r;let i=this.uniformLocations[e];if(!i)return void console.warn(`Uniform location for ${e} not found`);if(t instanceof HTMLImageElement)this.setTextureUniform(e,t);else if(Array.isArray(t)){let r=null,o=null;if(void 0!==t[0]&&Array.isArray(t[0])){let i=t[0].length;if(!t.every(e=>e.length===i))return void console.warn(`All child arrays must be the same length for ${e}`);r=t.flat(),o=i}else o=(r=t).length;switch(o){case 2:this.gl.uniform2fv(i,r);break;case 3:this.gl.uniform3fv(i,r);break;case 4:this.gl.uniform4fv(i,r);break;case 9:this.gl.uniformMatrix3fv(i,!1,r);break;case 16:this.gl.uniformMatrix4fv(i,!1,r);break;default:console.warn(`Unsupported uniform array length: ${o}`)}}else"number"==typeof t?this.gl.uniform1f(i,t):"boolean"==typeof t?this.gl.uniform1i(i,+!!t):console.warn(`Unsupported uniform type for ${e}: ${typeof t}`)})};getCurrentFrame=()=>this.currentFrame;setFrame=e=>{this.currentFrame=e,this.lastRenderTime=performance.now(),this.render(performance.now())};setSpeed=(e=1)=>{this.speed=e,this.setCurrentSpeed(document.hidden?0:e)};setCurrentSpeed=e=>{this.currentSpeed=e,null===this.rafId&&0!==e&&(this.lastRenderTime=performance.now(),this.rafId=requestAnimationFrame(this.render)),null!==this.rafId&&0===e&&(cancelAnimationFrame(this.rafId),this.rafId=null)};setMaxPixelCount=(e=o)=>{this.maxPixelCount=e,this.handleResize()};setMinPixelRatio=(e=2)=>{this.minPixelRatio=e,this.handleResize()};setUniforms=e=>{this.setUniformValues(e),this.providedUniforms={...this.providedUniforms,...e},this.render(performance.now())};handleDocumentVisibilityChange=()=>{this.setCurrentSpeed(document.hidden?0:this.speed)};dispose=()=>{this.hasBeenDisposed=!0,null!==this.rafId&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.gl&&this.program&&(this.textures.forEach(e=>{this.gl.deleteTexture(e)}),this.textures.clear(),this.gl.deleteProgram(this.program),this.program=null,this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.getError()),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),visualViewport?.removeEventListener("resize",this.handleVisualViewportChange),document.removeEventListener("visibilitychange",this.handleDocumentVisibilityChange),this.uniformLocations={},this.canvasElement.remove(),delete this.parentElement.paperShaderMount}}function a(e,t,r){let i=e.createShader(t);return i?(e.shaderSource(i,r),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS))?i:(console.error("An error occurred compiling the shaders: "+e.getShaderInfoLog(i)),e.deleteShader(i),null):null}let s=`@layer paper-shaders {
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
}`;async function l(e){let t={},r=[];return Object.entries(e).forEach(([e,i])=>{if("string"==typeof i){if(!i){t[e]=function(){if("undefined"==typeof window)return void console.warn("Paper Shaders: can’t create an image on the server");let e=new Image;return e.src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",e}();return}if(!(e=>{try{if(e.startsWith("/"))return!0;return new URL(e),!0}catch{return!1}})(i))return void console.warn(`Uniform "${e}" has invalid URL "${i}". Skipping image loading.`);let o=new Promise((r,o)=>{let n=new Image;(e=>{try{if(e.startsWith("/"))return!1;return new URL(e,window.location.origin).origin!==window.location.origin}catch{return!1}})(i)&&(n.crossOrigin="anonymous"),n.onload=()=>{t[e]=n,r()},n.onerror=()=>{console.error(`Could not set uniforms. Failed to load image at ${i}`),o()},n.src=i});r.push(o)}else t[e]=i}),await Promise.all(r),t}let u=(0,r.forwardRef)(function({fragmentShader:e,uniforms:i,webGlContextAttributes:o,speed:a=0,frame:s=0,width:u,height:c,minPixelRatio:f,maxPixelCount:h,style:d,...p},g){var v;let m,x,[_,b]=(0,r.useState)(!1),y=(0,r.useRef)(null),S=(0,r.useRef)(null),R=(0,r.useRef)(o);(0,r.useEffect)(()=>((async()=>{let t=await l(i);y.current&&!S.current&&(S.current=new n(y.current,e,t,R.current,a,s,f,h),b(!0))})(),()=>{S.current?.dispose(),S.current=null}),[e]),(0,r.useEffect)(()=>{let e=!1;return(async()=>{let t=await l(i);e||S.current?.setUniforms(t)})(),()=>{e=!0}},[i,_]),(0,r.useEffect)(()=>{S.current?.setSpeed(a)},[a,_]),(0,r.useEffect)(()=>{S.current?.setMaxPixelCount(h)},[h,_]),(0,r.useEffect)(()=>{S.current?.setMinPixelRatio(f)},[f,_]),(0,r.useEffect)(()=>{S.current?.setFrame(s)},[s,_]);let E=(v=[y,g],m=r.useRef(void 0),x=r.useCallback(e=>{let t=v.map(t=>{if(null!=t){if("function"==typeof t){let r=t(e);return"function"==typeof r?r:()=>{t(null)}}return t.current=e,()=>{t.current=null}}});return()=>{t.forEach(e=>e?.())}},v),r.useMemo(()=>v.every(e=>null==e)?null:e=>{m.current&&(m.current(),m.current=void 0),null!=e&&(m.current=x(e))},v));return(0,t.jsx)("div",{ref:E,style:void 0!==u||void 0!==c?{width:u,height:c,...d}:d,...p})});u.displayName="ShaderMount";let c=`
in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_patternUV;
in vec2 v_imageUV;`,f=`
in vec2 v_objectBoxSize;
in vec2 v_objectHelperBox;
in vec2 v_responsiveBoxSize;
in vec2 v_responsiveHelperBox;
in vec2 v_patternBoxSize;
in vec2 v_patternHelperBox;`,h=`
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;`,d={fit:"contain",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},p={none:0,contain:1,cover:2};function g(e){if(Array.isArray(e))return 4===e.length?e:3===e.length?[...e,1]:m;if("string"!=typeof e)return m;let t,r,i,o=1;if(e.startsWith("#")){var n;[t,r,i,o]=(3===(n=(n=e).replace(/^#/,"")).length&&(n=n.split("").map(e=>e+e).join("")),6===n.length&&(n+="ff"),[parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255,parseInt(n.slice(6,8),16)/255])}else if(e.startsWith("rgb")){let n;[t,r,i,o]=(n=e.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(n[1]??"0")/255,parseInt(n[2]??"0")/255,parseInt(n[3]??"0")/255,void 0===n[4]?1:parseFloat(n[4])]:[0,0,0,1]}else{let n;if(!e.startsWith("hsl"))return console.error("Unsupported color format",e),m;[t,r,i,o]=function(e){let t,r,i,[o,n,a,s]=e,l=o/360,u=n/100,c=a/100;if(0===n)t=r=i=c;else{let e=(e,t,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<1/6)?e+(t-e)*6*r:r<.5?t:r<2/3?e+(t-e)*(2/3-r)*6:e,o=c<.5?c*(1+u):c+u-c*u,n=2*c-o;t=e(n,o,l+1/3),r=e(n,o,l),i=e(n,o,l-1/3)}return[t,r,i,s]}((n=e.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(n[1]??"0"),parseInt(n[2]??"0"),parseInt(n[3]??"0"),void 0===n[4]?1:parseFloat(n[4])]:[0,0,0,1])}return[v(t,0,1),v(r,0,1),v(i,0,1),v(o,0,1)]}let v=(e,t,r)=>Math.min(Math.max(e,t),r),m=[0,0,0,1],x=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,_=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,b=`
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`,y=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[10];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

${c}
${f}
${h}

out vec4 fragColor;

${x}
${_}
${b}

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
`,S={name:"Default",params:{...d,speed:1,frame:0,colors:["#e0eaff","#241d9a","#f75092","#9f50d3"],distortion:.8,swirl:.1,grainMixer:0,grainOverlay:0}},R=(0,r.memo)(function({speed:e=S.params.speed,frame:r=S.params.frame,colors:i=S.params.colors,distortion:o=S.params.distortion,swirl:n=S.params.swirl,grainMixer:a=S.params.grainMixer,grainOverlay:s=S.params.grainOverlay,fit:l=S.params.fit,rotation:c=S.params.rotation,scale:f=S.params.scale,originX:h=S.params.originX,originY:d=S.params.originY,offsetX:v=S.params.offsetX,offsetY:m=S.params.offsetY,worldWidth:x=S.params.worldWidth,worldHeight:_=S.params.worldHeight,...b}){let R={u_colors:i.map(g),u_colorsCount:i.length,u_distortion:o,u_swirl:n,u_grainMixer:a,u_grainOverlay:s,u_fit:p[l],u_rotation:c,u_scale:f,u_offsetX:v,u_offsetY:m,u_originX:h,u_originY:d,u_worldWidth:x,u_worldHeight:_};return(0,t.jsx)(u,{...b,speed:e,frame:r,fragmentShader:y,uniforms:R})},function(e,t){for(let r in e){if("colors"===r){let r=Array.isArray(e.colors),i=Array.isArray(t.colors);if(!r||!i){if(!1===Object.is(e.colors,t.colors))return!1;continue}if(e.colors?.length!==t.colors?.length||!e.colors?.every((e,r)=>e===t.colors?.[r]))return!1;continue}if(!1===Object.is(e[r],t[r]))return!1}return!0});function E(){let[e]=(0,r.useState)(.5);return(0,t.jsxs)("div",{className:"w-full h-full absolute inset-0",children:[(0,t.jsx)(R,{className:"w-full h-full",colors:["#000000","#001F05","#141415","#333333"],speed:e}),(0,t.jsxs)("div",{className:"absolute inset-0 pointer-events-none",children:[(0,t.jsx)("div",{className:"absolute top-1/4 left-1/3 w-32 h-32 bg-[#001F05]/10 rounded-full blur-3xl animate-pulse"}),(0,t.jsx)("div",{className:"absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#141415]/5 rounded-full blur-2xl animate-pulse"}),(0,t.jsx)("div",{className:"absolute top-1/2 right-1/3 w-20 h-20 bg-[#001F05]/8 rounded-full blur-xl animate-pulse"})]})]})}var U=e.i(772295),w=e.i(538226),B=e.i(201050),A=e.i(388675);function P(){let e=(0,B.useUser)({or:"return-null"}),i=(0,A.useRouter)();return((0,r.useEffect)(()=>{e&&i.push("/dashboard")},[e,i]),e)?(0,t.jsxs)("div",{className:"relative min-h-screen bg-black overflow-hidden",children:[(0,t.jsx)(E,{}),(0,t.jsx)("div",{className:"relative z-10 flex items-center justify-center min-h-screen",children:(0,t.jsx)("div",{className:"text-white",children:"Redirecionando..."})})]}):(0,t.jsxs)("div",{className:"relative min-h-screen bg-black overflow-hidden",children:[(0,t.jsx)(E,{}),(0,t.jsx)("div",{className:"relative z-10 flex flex-col items-center justify-center min-h-screen px-4",children:(0,t.jsxs)("div",{className:"text-center space-y-8 max-w-3xl mx-auto",children:[(0,t.jsx)("h1",{className:"text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight",children:"Um novo universo para o seu negocio comeca aqui"}),(0,t.jsxs)("div",{className:"pt-6 flex flex-wrap justify-center gap-4",children:[(0,t.jsx)(w.default,{href:"/auth/login",children:(0,t.jsx)(U.Button,{size:"lg",className:"bg-[#001F05] hover:bg-[#001F05]/80 text-white px-12 py-4 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg border border-[#001F05]/20",children:"Entrar"})}),(0,t.jsx)(w.default,{href:"/auth/register",children:(0,t.jsx)(U.Button,{size:"lg",variant:"outline",className:"border-[#001F05]/50 text-white hover:bg-[#001F05]/20 px-12 py-4 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg",children:"Cadastrar"})}),(0,t.jsx)(w.default,{href:"/rider/login",children:(0,t.jsx)(U.Button,{size:"lg",variant:"outline",className:"border-orange-500/40 text-orange-400 hover:bg-orange-500/10 px-12 py-4 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg",children:"Motoboys"})})]})]})})]})}e.s(["default",()=>P],202700)}]);