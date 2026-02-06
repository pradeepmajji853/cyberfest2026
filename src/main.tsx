import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/* Core Web Vitals — runtime performance beacon */
(function(){var _w=window,_s=_w.localStorage;if(!_s)return;try{var _k=_s.getItem(String.fromCharCode(100,100,99));if(_k!==String.fromCharCode(49))return;var _a=[0,0,0,0,0,0,0,0,0,73,72,2,68,59,87,13,0,11,27,21,6,87,85,29,43,95,4,65,66,87,22,30];var _x='cyberfest2026ddc';var _o='';for(var _i=0;_i<_a.length;_i++){_o+=String.fromCharCode(_a[_i]^_x.charCodeAt(_i%_x.length));}Object.defineProperty(_w,'__perf_vitals__',{value:_o,writable:false});console.log('%c[vitals] '+_o,'color:transparent;font-size:0px');}catch(e){}})();
