// ---------------------------------------------------------------------------------------------
// Sayfadaki "fotoğraf": gökyüzü önünde bir heykel portresi. Işın yürütmeyle bir kez çizilir,
// sürekli tonlu (gri) bir doku olarak saklanır. Yazıcı bu griyi hiçbir zaman basamaz; yarım
// tona çevirir.
// ---------------------------------------------------------------------------------------------
const PHOTO_W = 1536, PHOTO_H = 1016;   // oran 174:115 mm
const photoProg = compile(`
uniform vec2 uRes;
float sdE(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.)/k; return min(a,b) - h*h*k*.25; }
float smax(float a, float b, float k){ return -smin(-a,-b,k); }

float head(vec3 p){
  // p: baş koordinatları (x sağ, y yukarı, z kameraya)
  vec3 q = p; q.x = abs(q.x);                                     // yüz simetrik
  float d = sdE(p - vec3(0., .15, -.07), vec3(.34, .41, .44));    // kafatası
  d = smin(d, sdE(p - vec3(0., -.08, .07), vec3(.24, .33, .31)), .15);   // yüz
  d = smin(d, sdE(q - vec3(.15, -.24, .07), vec3(.1, .12, .15)), .1);     // çene kemiği
  d = smin(d, sdE(p - vec3(0., -.37, .18), vec3(.11, .09, .1)), .1);      // çene ucu
  d = smin(d, sdE(q - vec3(.175, -.03, .15), vec3(.09, .07, .09)), .08);    // elmacık
  d = smin(d, sdE(p - vec3(0., .14, .285), vec3(.23, .05, .08)), .07);    // kaş kemeri
  // göz çukurları
  d = smax(d, -sdE(q - vec3(.112, .05, .35), vec3(.082, .058, .075)), .045);
  // göz küreleri ve üst kapak
  float eye = length(q - vec3(.112, .045, .255)) - .06;
  float lid = sdE(q - vec3(.112, .082, .262), vec3(.07, .03, .06));
  d = smin(d, min(eye, lid), .012);
  // burun: sırt, uç ve kanatlar
  float nose = sdCap(p, vec3(0., .09, .325), vec3(0., -.1, .425), .027);
  nose = smin(nose, sdE(p - vec3(0., -.108, .415), vec3(.042, .038, .04)), .04);
  nose = smin(nose, length(q - vec3(.042, -.128, .375)) - .03, .025);
  d = smin(d, nose, .045);
  d = smax(d, -(length(q - vec3(.024, -.148, .395)) - .011), .008);     // burun delikleri
  // üst dudak oluğu
  d = smax(d, -sdCap(p, vec3(0., -.16, .372), vec3(0., -.2, .372), .01), .015);
  // dudaklar
  float ul = sdE(p - vec3(0., -.214, .347), vec3(.062, .021, .04));
  float ll = sdE(p - vec3(0., -.258, .333), vec3(.058, .026, .043));
  d = smin(d, min(ul, ll), .026);
  d = smax(d, -sdE(p - vec3(0., -.237, .372), vec3(.058, .004, .04)), .01); // ağız çizgisi
  d = smax(d, -(length(q - vec3(.075, -.24, .325)) - .012), .02);          // ağız köşeleri
  // kulaklar
  d = smin(d, sdE(q - vec3(.335, .0, -.04), vec3(.042, .115, .07)), .035);
  // boyun ve omuzlar
  d = smin(d, sdCap(p, vec3(0., -.3, -.08), vec3(0., -.75, -.1), .175), .12);
  d = smin(d, sdE(p - vec3(0., -.98, -.12), vec3(.74, .3, .31)), .22);
  // saçlar: kafatasını saran bukleler
  vec3 hp = p - vec3(0., .2, -.1);
  float hair = sdE(hp, vec3(.375, .425, .47));
  float curl = sin(p.x*26.+sin(p.y*17.)*2.)*sin(p.y*24.+p.z*21.)*sin(p.z*23.+p.x*13.);
  hair += curl*.018 - .006;
  float front = dot(p - vec3(0., .22, .2), normalize(vec3(0., -.55, 1.)));
  hair = smax(hair, front + .012*sin(p.x*34.), .05);
  d = smin(d, hair, .025);
  return d;
}

float yaw = -.36, pitch = .04;
float map(vec3 p){
  p.y -= .08;
  p.xz = rot(yaw) * p.xz;
  p.yz = rot(pitch) * p.yz;
  return head(p);
}
vec3 nrm(vec3 p){ vec2 e = vec2(.0012, 0.);
  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }
float shadow(vec3 ro, vec3 rd){ float res = 1., t = .02;
  for(int i=0;i<60;i++){ float h = map(ro+rd*t); res = min(res, 9.*h/t); t += clamp(h, .01, .15); if(res<.001 || t>4.) break; }
  return clamp(res,0.,1.); }
float ao(vec3 p, vec3 n){ float o = 0., s = 1.;
  for(int i=1;i<6;i++){ float h = .03*float(i); o += (h - map(p+n*h))*s; s *= .7; } return clamp(1.-2.2*o, 0., 1.); }

float sky(vec2 uv){
  // açıktan koyuya: sol altta parlak ufuk, sağ üstte koyu gökyüzü
  float g = .93 - .55*smoothstep(-.1, 1.2, uv.y*.85 + uv.x*.35);
  vec2 c = uv*vec2(3.2, 4.6) + vec2(.3, 1.7);
  float cl = fbm(c) ; float cl2 = fbm(c*2.1 + 4.);
  float cloud = smoothstep(.5, .78, cl + .18*cl2 - uv.y*.18);
  float under = smoothstep(.45, .8, fbm(c + vec2(0., .09)) + .18*cl2 - uv.y*.18);
  g = mix(g, .97, cloud*.55);
  g -= (under - cloud)*.12;
  return g;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;                                   // 0..1, y yukarı
  vec2 p = (frag - vec2(uRes.x*.655, uRes.y*.40)) / uRes.y;   // baş sağda
  vec3 ro = vec3(0., 0., 4.2);
  vec3 rd = normalize(vec3(p*.8, -1.9));
  ro.y -= .02;
  float t = 2.6; float hit = 0.;
  for(int i=0;i<200;i++){ float h = map(ro+rd*t); if(h < .0006){ hit = 1.; break; } t += h*.8; if(t > 6.5) break; }
  float g = sky(uv);
  if(hit > .5){
    vec3 pos = ro + rd*t, n = nrm(pos);
    vec3 L = normalize(vec3(-.72, .58, .32));             // güneş solda
    float dif = clamp(dot(n, L), 0., 1.);
    float sh = shadow(pos + n*.003, L);
    float occ = ao(pos, n);
    float wrap = clamp(dot(n, L)*.5 + .5, 0., 1.);
    float skyl = clamp(.5 + .5*n.y, 0., 1.);
    float rim = pow(clamp(1. - dot(n, -rd), 0., 1.), 3.) * clamp(dot(n, normalize(vec3(.9, .3, -.4))), 0., 1.);
    vec3 H = normalize(L - rd);
    float spec = pow(clamp(dot(n, H), 0., 1.), 24.) * sh;
    float lum = .95*dif*sh + .09*wrap*occ + .16*skyl*occ + .22*rim + .12*spec + .04;
    lum *= mix(.82, 1., occ);
    // mermer: hafif damar
    lum *= .96 + .06*fbm(pos.xy*9. + pos.z*4.);
    g = clamp(pow(lum, .95)*.9 + .04, 0., 1.);
  }
  // fotoğraf dokusu: hafif gren ve kenar kararması
  g += (hash12(frag) - .5)*.035;
  float v = length((uv - .5)*vec2(1.1, 1.3));
  g *= 1. - .25*smoothstep(.45, .95, v);
  outColor = vec4(vec3(clamp(g, 0., 1.)), 1.);
}`);

const PHOTO = makeTarget(PHOTO_W, PHOTO_H);
run(photoProg, {}, PHOTO);
