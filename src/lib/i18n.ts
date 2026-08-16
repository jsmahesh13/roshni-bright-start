/**
 * Roshni interface translations.
 *
 * The English / Hindi / Kannada strings are taken verbatim from the reviewed
 * prototype dictionary (reference/roshni-prototype.html) — never machine
 * translated here. Only fixed UI chrome is translated: student names, teacher
 * noticing text, computed digest questions, summary bodies and helpline
 * numbers always stay exactly as they were entered.
 */

export type Lang = "en" | "hi" | "kn";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export const DICTIONARY = {
  signin: {"en":"Sign in","hi":"साइन इन","kn":"ಸೈನ್ ಇನ್"},
  register: {"en":"Register","hi":"रजिस्टर","kn":"ನೋಂದಣಿ"},
  getstarted: {"en":"Get started →","hi":"शुरू करें →","kn":"ಪ್ರಾರಂಭಿಸಿ →"},
  seehow: {"en":"See how it works","hi":"यह कैसे काम करता है","kn":"ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ"},
  hero: {"en":"See every child. Even the quiet one.","hi":"हर बच्चे को देखिए। उस चुपचाप बच्चे को भी।","kn":"ಪ್ರತಿ ಮಗುವನ್ನೂ ಗಮನಿಸಿ. ಆ ಮೌನ ಮಗುವನ್ನೂ ಸಹ."},
  sub: {"en":"Roshni helps a teacher hold what they notice about forty children — one honest line at a time — and quietly surfaces the child who needs them.","hi":"रोशनी शिक्षक को चालीस बच्चों के बारे में की गई टिप्पणियाँ संभालने में मदद करती है — एक बार में एक सच्ची पंक्ति — और चुपचाप उस बच्चे को सामने लाती है जिसे आपकी ज़रूरत है।","kn":"ರೋಶ್ನಿ ಶಿಕ್ಷಕರಿಗೆ ನಲವತ್ತು ಮಕ್ಕಳ ಬಗ್ಗೆ ಗಮನಿಸಿದ್ದನ್ನು ಒಂದೊಂದಾಗಿ ದಾಖಲಿಸಲು ನೆರವಾಗುತ್ತದೆ — ಮತ್ತು ನಿಮ್ಮ ಅಗತ್ಯವಿರುವ ಮಗುವನ್ನು ಮೆಲ್ಲನೆ ತೋರಿಸುತ್ತದೆ."},
  track: {"en":"India · Health & Wellbeing · Education","hi":"भारत · स्वास्थ्य एवं कल्याण · शिक्षा","kn":"ಭಾರತ · ಆರೋಗ್ಯ ಮತ್ತು ಯೋಗಕ್ಷೇಮ · ಶಿಕ್ಷಣ"},
  note1: {"en":"the child who never gets written about","hi":"वह बच्चा जिसके बारे में कभी नहीं लिखा जाता","kn":"ಯಾರ ಬಗ್ಗೆಯೂ ಬರೆಯದ ಮಗು"},
  note2: {"en":"is not a well-behaved child","hi":"शांत बच्चा नहीं होता","kn":"ಒಳ್ಳೆಯ ನಡತೆಯ ಮಗು ಅಲ್ಲ"},
  howtitle: {"en":"Notice. See. Act.","hi":"टिप्पणी। देखें। कार्य।","kn":"ಗಮನಿಸಿ. ನೋಡಿ. ಕ್ರಮ."},
  s1t: {"en":"Notice","hi":"टिप्पणी","kn":"ಗಮನಿಸಿ"},
  s2t: {"en":"See","hi":"देखें","kn":"ನೋಡಿ"},
  s3t: {"en":"Act","hi":"कार्य","kn":"ಕ್ರಮ"},
  s1d: {"en":"Type it the way you’d say it. Roshni structures a messy line into clean, dated observations — and refuses to save a label like “lazy”.","hi":"जैसा कहेंगे वैसा लिखिए। रोशनी उलझी पंक्ति को साफ़, दिनांकित टिप्पणियों में बदल देती है — और “आलसी” जैसा लेबल सहेजने से मना कर देती है।","kn":"ನೀವು ಹೇಳುವಂತೆ ಬರೆಯಿರಿ. ರೋಶ್ನಿ ಗೊಂದಲದ ಸಾಲನ್ನು ಸ್ಪಷ್ಟ, ದಿನಾಂಕಿತ ಟಿಪ್ಪಣಿಗಳಾಗಿ ಮಾಡುತ್ತದೆ — “ಸೋಮಾರಿ” ಎಂಬ ಹಣೆಪಟ್ಟಿಯನ್ನು ಉಳಿಸುವುದಿಲ್ಲ."},
  s2d: {"en":"The whole class as points of light. The bright ones need you now; the faint ones are the children slipping out of view.","hi":"पूरी कक्षा रौशनी के बिंदुओं के रूप में। चमकते हुए बच्चों को अभी आपकी ज़रूरत है; धुँधले बच्चे नज़र से ओझल हो रहे हैं।","kn":"ಇಡೀ ತರಗತಿ ಬೆಳಕಿನ ಬಿಂದುಗಳಾಗಿ. ಪ್ರಕಾಶಮಾನವಾದವರಿಗೆ ಈಗ ನಿಮ್ಮ ಅಗತ್ಯವಿದೆ; ಮಂದವಾದವರು ಕಣ್ಣಿಂದ ಮರೆಯಾಗುತ್ತಿದ್ದಾರೆ."},
  s3d: {"en":"When a pattern crosses a line, Roshni prepares a dated, domain-wise summary with real, region-specific support to act on.","hi":"जब कोई पैटर्न सीमा पार करता है, रोशनी दिनांकित, क्षेत्रवार सारांश तैयार करती है — साथ में असली, क्षेत्र-विशिष्ट सहायता।","kn":"ಒಂದು ಮಾದರಿ ಗಡಿ ದಾಟಿದಾಗ, ರೋಶ್ನಿ ದಿನಾಂಕಿತ, ಕ್ಷೇತ್ರವಾರು ಸಾರಾಂಶವನ್ನು — ನಿಜವಾದ, ಪ್ರದೇಶ-ನಿರ್ದಿಷ್ಟ ಸಹಾಯದೊಂದಿಗೆ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ."},
  caretitle: {"en":"Built with restraint.","hi":"संयम के साथ बनाया गया।","kn":"ಸಂಯಮದಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ."},
  caredesc: {"en":"A record of children is a serious thing. Roshni is designed around what it will not do.","hi":"बच्चों का रिकॉर्ड एक गंभीर बात है। रोशनी को इस आधार पर बनाया गया है कि वह क्या नहीं करेगी।","kn":"ಮಕ್ಕಳ ದಾಖಲೆ ಗಂಭೀರ ವಿಷಯ. ರೋಶ್ನಿ ಏನನ್ನು ಮಾಡುವುದಿಲ್ಲ ಎಂಬುದರ ಸುತ್ತ ವಿನ್ಯಾಸಗೊಂಡಿದೆ."},
  t1: {"en":"never talks to a student","hi":"कभी छात्र से बात नहीं करता","kn":"ವಿದ್ಯಾರ್ಥಿಯೊಂದಿಗೆ ಎಂದೂ ಮಾತನಾಡುವುದಿಲ್ಲ"},
  t2: {"en":"never diagnoses or scores","hi":"कभी निदान या स्कोर नहीं देता","kn":"ಎಂದೂ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಅಂಕ ನೀಡುವುದಿಲ್ಲ"},
  t3: {"en":"forgets on purpose","hi":"जानबूझकर भूल जाता है","kn":"ಉದ್ದೇಶಪೂರ್ವಕ ಮರೆಯುತ್ತದೆ"},
  footl: {"en":"every child, in the light","hi":"हर बच्चा, रौशनी में","kn":"ಪ್ರತಿ ಮಗುವೂ ಬೆಳಕಿನಲ್ಲಿ"},
  nav_home: {"en":"This week","hi":"इस सप्ताह","kn":"ಈ ವಾರ"},
  nav_notice: {"en":"Notice","hi":"टिप्पणी","kn":"ಗಮನಿಸಿ"},
  nav_class: {"en":"The class","hi":"कक्षा","kn":"ತರಗತಿ"},
  nav_school: {"en":"School","hi":"विद्यालय","kn":"ಶಾಲೆ"},
  language: {"en":"Language","hi":"भाषा","kn":"ಭಾಷೆ"},
  switch: {"en":"Switch","hi":"बदलें","kn":"ಬದಲಿಸಿ"},
  h_home: {"en":"Three things worth your attention.","hi":"ध्यान देने योग्य तीन बातें।","kn":"ಗಮನ ಹರಿಸಬೇಕಾದ ಮೂರು ವಿಷಯಗಳು."},
  p_home: {"en":"Questions, not findings. Each opens onto the noticings it came from. You know the child; Roshni only knows the notes.","hi":"निष्कर्ष नहीं, प्रश्न। प्रत्येक उन टिप्पणियों तक ले जाता है जिनसे यह बना। बच्चे को आप जानते हैं; रोशनी केवल टिप्पणियाँ जानती है।","kn":"ತೀರ್ಮಾನಗಳಲ್ಲ, ಪ್ರಶ್ನೆಗಳು. ಪ್ರತಿಯೊಂದೂ ಅದು ಬಂದ ಟಿಪ್ಪಣಿಗಳಿಗೆ ತೆರೆಯುತ್ತದೆ. ಮಗುವನ್ನು ನೀವು ಬಲ್ಲಿರಿ; ರೋಶ್ನಿ ಟಿಪ್ಪಣಿಗಳನ್ನಷ್ಟೇ ಬಲ್ಲದು."},
  h_notice: {"en":"Write it the way you’d say it.","hi":"जैसा कहेंगे वैसा लिखिए।","kn":"ನೀವು ಹೇಳುವಂತೆ ಬರೆಯಿರಿ."},
  h_class: {"en":"Everyone you hold.","hi":"आपके सभी बच्चे।","kn":"ನೀವು ಹೊಂದಿರುವ ಎಲ್ಲರೂ."},
  h_school: {"en":"What this school allows.","hi":"यह विद्यालय क्या अनुमति देता है।","kn":"ಈ ಶಾಲೆ ಏನನ್ನು ಅನುಮತಿಸುತ್ತದೆ."},
  p_class_register: {"en":"A register of every child. The strip is two years of noticings — strengths above the line, concern below. A nearly-blank line is a child nobody has written about.","hi":"हर बच्चे का रजिस्टर। पट्टी दो वर्षों की टिप्पणियाँ है — रेखा के ऊपर क्षमताएँ, नीचे चिंताएँ। लगभग खाली रेखा वह बच्चा है जिसके बारे में किसी ने नहीं लिखा।","kn":"ಪ್ರತಿ ಮಗುವಿನ ರಿಜಿಸ್ಟರ್. ಪಟ್ಟಿ ಎರಡು ವರ್ಷಗಳ ಟಿಪ್ಪಣಿಗಳು — ಗೆರೆಯ ಮೇಲೆ ಸಾಮರ್ಥ್ಯ, ಕೆಳಗೆ ಕಳವಳ. ಬಹುತೇಕ ಖಾಲಿ ಗೆರೆ ಎಂದರೆ ಯಾರೂ ಬರೆಯದ ಮಗು."},
  p_class_heatmap: {"en":"A mark-book: each row a child, each column a stretch of time. Green where strengths outweigh concern, red where concern outweighs — blank where nothing was noticed at all.","hi":"अंक-पुस्तिका: प्रत्येक पंक्ति एक बच्चा, प्रत्येक स्तंभ एक समयावधि। हरा जहाँ क्षमताएँ अधिक, लाल जहाँ चिंता अधिक — रिक्त जहाँ कुछ नहीं देखा गया।","kn":"ಅಂಕ-ಪುಸ್ತಕ: ಪ್ರತಿ ಸಾಲು ಒಂದು ಮಗು, ಪ್ರತಿ ಕಾಲಂ ಒಂದು ಕಾಲಾವಧಿ. ಸಾಮರ್ಥ್ಯ ಹೆಚ್ಚಿರುವಲ್ಲಿ ಹಸಿರು, ಕಳವಳ ಹೆಚ್ಚಿರುವಲ್ಲಿ ಕೆಂಪು — ಏನೂ ಗಮನಿಸದಿರುವಲ್ಲಿ ಖಾಲಿ."},
  p_class_lights: {"en":"A night sky of your class. Each child orbits by how recently you noticed them — close in your light, or drifting past the dashed 6-week line into the dark. Warm = doing well, red = needs you, cold blue = fading.","hi":"आपकी कक्षा का रात्रि आकाश। हर बच्चा इस आधार पर परिक्रमा करता है कि आपने उसे कितनी हाल ही में देखा — पास रौशनी में, या 6-सप्ताह रेखा पार कर अंधेरे में। गर्म = ठीक, लाल = ज़रूरत, ठंडा नीला = ओझल।","kn":"ನಿಮ್ಮ ತರಗತಿಯ ರಾತ್ರಿ ಆಕಾಶ. ಪ್ರತಿ ಮಗುವೂ ನೀವು ಎಷ್ಟು ಇತ್ತೀಚೆಗೆ ಗಮನಿಸಿದಿರಿ ಎಂಬುದರ ಆಧಾರದಲ್ಲಿ ಸುತ್ತುತ್ತದೆ — ಬೆಳಕಿನಲ್ಲಿ ಹತ್ತಿರ, ಅಥವಾ 6-ವಾರ ಗೆರೆ ದಾಟಿ ಕತ್ತಲೆಗೆ. ಬೆಚ್ಚಗೆ = ಚೆನ್ನಾಗಿದೆ, ಕೆಂಪು = ಅಗತ್ಯ, ತಣ್ಣನೆ ನೀಲಿ = ಮರೆಯಾಗುತ್ತಿದೆ."},
  btn_structure: {"en":"Structure it →","hi":"व्यवस्थित करें →","kn":"ವ್ಯವಸ್ಥೆಗೊಳಿಸಿ →"},
  btn_save: {"en":"Save approved noticings →","hi":"स्वीकृत टिप्पणियाँ सहेजें →","kn":"ಅನುಮೋದಿತ ಟಿಪ್ಪಣಿಗಳನ್ನು ಉಳಿಸಿ →"},
  useexample: {"en":"Use example","hi":"उदाहरण","kn":"ಉದಾಹರಣೆ"},
  noticenow: {"en":"Notice something now","hi":"अभी कुछ टिप्पणी करें","kn":"ಈಗ ಏನಾದರೂ ಗಮನಿಸಿ"},
  openclass: {"en":"Open the class →","hi":"कक्षा खोलें →","kn":"ತರಗತಿ ತೆರೆಯಿರಿ →"},
  glowfade: {"en":"Who needs you, who’s fading","hi":"किसे आपकी ज़रूरत है, कौन ओझल हो रहा है","kn":"ಯಾರಿಗೆ ನಿಮ್ಮ ಅಗತ್ಯವಿದೆ, ಯಾರು ಮರೆಯಾಗುತ್ತಿದ್ದಾರೆ"},
  ataglance: {"en":"The class, at a glance","hi":"एक नज़र में कक्षा","kn":"ಒಂದು ನೋಟದಲ್ಲಿ ತರಗತಿ"},
  back_class: {"en":"← back to the class","hi":"← कक्षा में वापस","kn":"← ತರಗತಿಗೆ ಹಿಂತಿರುಗಿ"},
  btn_summary: {"en":"Generate observation summary →","hi":"अवलोकन सारांश बनाएँ →","kn":"ಅವಲೋಕನ ಸಾರಾಂಶ ರಚಿಸಿ →"},
  needsyou: {"en":"Needs you","hi":"ज़रूरत","kn":"ಅಗತ್ಯವಿದೆ"},
  fadingfirst: {"en":"Fading first","hi":"ओझल पहले","kn":"ಮರೆಯಾಗುವವರು ಮೊದಲು"},
  mostnoticed: {"en":"Most noticed","hi":"सर्वाधिक टिप्पणी","kn":"ಹೆಚ್ಚು ಗಮನಿಸಿದವರು"},
  over: {"en":"Over","hi":"अवधि","kn":"ಅವಧಿ"},
  sort: {"en":"Sort","hi":"क्रम","kn":"ವಿಂಗಡಣೆ"},
  term: {"en":"Term","hi":"सत्र","kn":"ಅವಧಿ"},
  year: {"en":"Year","hi":"वर्ष","kn":"ವರ್ಷ"},
  all: {"en":"All","hi":"सभी","kn":"ಎಲ್ಲಾ"},
  whatcolours: {"en":"What the colours mean · the type of thing noticed","hi":"रंगों का अर्थ · किस प्रकार की बात देखी गई","kn":"ಬಣ್ಣಗಳ ಅರ್ಥ · ಯಾವ ಬಗೆಯ ವಿಷಯ ಗಮನಿಸಲಾಗಿದೆ"},
  yourattention: {"en":"Your attention","hi":"आपका ध्यान","kn":"ನಿಮ್ಮ ಗಮನ"},
  gravtitle: {"en":"The arithmetic of being overlooked.","hi":"अनदेखे रह जाने का गणित।","kn":"ಕಡೆಗಣಿಸಲ್ಪಡುವ ಲೆಕ್ಕಾಚಾರ."},
  gravsub: {"en":"In an Indian government classroom, one teacher can hold forty to sixty children. Attention is finite — so some kids simply slip through, not from neglect but from numbers.","hi":"भारतीय सरकारी कक्षा में एक शिक्षक चालीस से साठ बच्चों को संभालता है। ध्यान सीमित है — इसलिए कुछ बच्चे छूट जाते हैं, उपेक्षा से नहीं, संख्या से।","kn":"ಭಾರತದ ಸರ್ಕಾರಿ ತರಗತಿಯಲ್ಲಿ ಒಬ್ಬ ಶಿಕ್ಷಕ ನಲವತ್ತರಿಂದ ಅರವತ್ತು ಮಕ್ಕಳನ್ನು ನೋಡಿಕೊಳ್ಳುತ್ತಾರೆ. ಗಮನ ಸೀಮಿತ — ಆದ್ದರಿಂದ ಕೆಲವರು ತಪ್ಪಿಹೋಗುತ್ತಾರೆ, ನಿರ್ಲಕ್ಷ್ಯದಿಂದಲ್ಲ, ಸಂಖ್ಯೆಯಿಂದ."},
  viewlabel: {"en":"View","hi":"दृश्य","kn":"ನೋಟ"},
  v_register: {"en":"Register","hi":"रजिस्टर","kn":"ರಿಜಿಸ್ಟರ್"},
  v_lights: {"en":"Constellation","hi":"तारामंडल","kn":"ನಕ್ಷತ್ರಪುಂಜ"},
  hcell: {"en":"each cell = a period of time","hi":"प्रत्येक कोष्ठ = एक समयावधि","kn":"ಪ್ರತಿ ಕೋಶ = ಒಂದು ಕಾಲಾವಧಿ"},
  hstr: {"en":"net strengths","hi":"कुल क्षमताएँ","kn":"ನಿವ್ವಳ ಸಾಮರ್ಥ್ಯ"},
  hcon: {"en":"net concern","hi":"कुल चिंता","kn":"ನಿವ್ವಳ ಕಳವಳ"},
  hblank: {"en":"blank = nothing noticed","hi":"रिक्त = कुछ नहीं देखा गया","kn":"ಖಾಲಿ = ಏನೂ ಗಮನಿಸಿಲ್ಲ"},
  strengths: {"en":"▲ Strengths","hi":"▲ क्षमताएँ","kn":"▲ ಸಾಮರ್ಥ್ಯಗಳು"},
  concerns: {"en":"▼ Concerns","hi":"▼ चिंताएँ","kn":"▼ ಕಳವಳಗಳು"},
  obssummary: {"en":"Observation summary","hi":"अवलोकन सारांश","kn":"ಅವಲೋಕನ ಸಾರಾಂಶ"},
  print: {"en":"Print / PDF","hi":"प्रिंट / PDF","kn":"ಮುದ್ರಿಸಿ / PDF"},
  close: {"en":"Close","hi":"बंद करें","kn":"ಮುಚ್ಚಿ"},
  f_engagement: {"en":"Engagement","hi":"सहभागिता","kn":"ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ"},
  f_social: {"en":"Social","hi":"सामाजिक","kn":"ಸಾಮಾಜಿಕ"},
  f_academic: {"en":"Academic","hi":"शैक्षणिक","kn":"ಶೈಕ್ಷಣಿಕ"},
  f_affect: {"en":"Emotion","hi":"भावना","kn":"ಭಾವನೆ"},
  f_strength: {"en":"Strength","hi":"क्षमता","kn":"ಸಾಮರ್ಥ್ಯ"},
  f_action: {"en":"Action","hi":"कार्रवाई","kn":"ಕ್ರಮ"},
  m_engagement: {"en":"attention & participation","hi":"ध्यान व सहभागिता","kn":"ಗಮನ ಮತ್ತು ಪಾಲ್ಗೊಳ್ಳುವಿಕೆ"},
  m_social: {"en":"friendships & belonging","hi":"मित्रता व अपनापन","kn":"ಸ್ನೇಹ ಮತ್ತು ಸೇರ್ಪಡೆ"},
  m_academic: {"en":"learning & work","hi":"सीखना व कार्य","kn":"ಕಲಿಕೆ ಮತ್ತು ಕೆಲಸ"},
  m_affect: {"en":"mood & feeling","hi":"मनोदशा व भावना","kn":"ಮನಸ್ಥಿತಿ ಮತ್ತು ಭಾವನೆ"},
  m_strength: {"en":"what’s going well","hi":"जो अच्छा हो रहा है","kn":"ಚೆನ್ನಾಗಿ ನಡೆಯುತ್ತಿರುವುದು"},
  m_action: {"en":"what you did","hi":"आपने क्या किया","kn":"ನೀವು ಏನು ಮಾಡಿದಿರಿ"},
  email: {"en":"Email","hi":"ईमेल","kn":"ಇಮೇಲ್"},
  password: {"en":"Password","hi":"पासवर्ड","kn":"ಪಾಸ್‌ವರ್ಡ್"},
  enter: {"en":"Enter","hi":"प्रवेश","kn":"ಪ್ರವೇಶಿಸಿ"},
  orstaff: {"en":"Or sign in as a seeded staff member ↓","hi":"या किसी डेमो स्टाफ़ के रूप में साइन इन करें ↓","kn":"ಅಥವಾ ಡೆಮೊ ಸಿಬ್ಬಂದಿಯಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ ↓"},
  demonote: {"en":"Demo build — seeded school data, no real children.","hi":"डेमो संस्करण — नमूना विद्यालय डेटा, कोई वास्तविक बच्चा नहीं।","kn":"ಡೆಮೊ ಆವೃತ್ತಿ — ಮಾದರಿ ಶಾಲಾ ದತ್ತಾಂಶ, ನಿಜವಾದ ಮಕ್ಕಳಲ್ಲ."},
  backhome: {"en":"← back to home","hi":"← मुखपृष्ठ पर वापस","kn":"← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ"},
  stat1: {"en":"the legal pupil–teacher norm (RTE). Real government classrooms often run 40–60 : 1.","hi":"कानूनी छात्र–शिक्षक मानक (आरटीई)। वास्तविक सरकारी कक्षाएँ अक्सर 40–60 : 1 होती हैं।","kn":"ಕಾನೂನುಬದ್ಧ ವಿದ್ಯಾರ್ಥಿ–ಶಿಕ್ಷಕ ಮಾನದಂಡ (ಆರ್‌ಟಿಇ). ನಿಜವಾದ ಸರ್ಕಾರಿ ತರಗತಿಗಳು ಹಲವು ಬಾರಿ 40–60 : 1."},
  stat2: {"en":"children learning in ~1 lakh single-teacher schools — one adult for the whole school.","hi":"लगभग 1 लाख एकल-शिक्षक विद्यालयों में पढ़ते बच्चे — पूरे विद्यालय के लिए एक ही वयस्क।","kn":"ಸುಮಾರು 1 ಲಕ್ಷ ಏಕ-ಶಿಕ್ಷಕ ಶಾಲೆಗಳಲ್ಲಿ ಕಲಿಯುತ್ತಿರುವ ಮಕ್ಕಳು — ಇಡೀ ಶಾಲೆಗೆ ಒಬ್ಬರೇ ವಯಸ್ಕ."},
  stat3: {"en":"adolescents lives with a mental-health condition — most of it never noticed.","hi":"किशोरों में मानसिक-स्वास्थ्य स्थिति — जिसे अधिकतर कभी देखा ही नहीं जाता।","kn":"ಹದಿಹರೆಯದವರಲ್ಲಿ ಮಾನಸಿಕ-ಆರೋಗ್ಯ ಸ್ಥಿತಿ — ಬಹುಪಾಲು ಎಂದೂ ಗಮನಕ್ಕೆ ಬರುವುದಿಲ್ಲ."},
  stat4: {"en":"counsellors in most government schools. The class teacher is the only safety net.","hi":"अधिकांश सरकारी विद्यालयों में परामर्शदाता। कक्षा शिक्षक ही एकमात्र सहारा है।","kn":"ಬಹುತೇಕ ಸರ್ಕಾರಿ ಶಾಲೆಗಳಲ್ಲಿ ಸಲಹೆಗಾರರು. ತರಗತಿ ಶಿಕ್ಷಕರೇ ಏಕೈಕ ಆಸರೆ."},
  zone_light: {"en":"in your light","hi":"आपकी रौशनी में","kn":"ನಿಮ್ಮ ಬೆಳಕಿನಲ್ಲಿ"},
  zone_slipping: {"en":"slipping","hi":"ओझल होते","kn":"ಜಾರುತ್ತಿರುವವರು"},
  zone_dark: {"en":"in the dark","hi":"अंधेरे में","kn":"ಕತ್ತಲೆಯಲ್ಲಿ"},
  key_well: {"en":"doing well","hi":"ठीक चल रहा है","kn":"ಚೆನ್ನಾಗಿದೆ"},
  key_needs: {"en":"needs you","hi":"आपकी ज़रूरत","kn":"ನಿಮ್ಮ ಅಗತ್ಯವಿದೆ"},
  key_fading: {"en":"fading","hi":"ओझल","kn":"ಮರೆಯಾಗುತ್ತಿದೆ"},
  d_social: {"en":"Social & belonging","hi":"सामाजिक व अपनापन","kn":"ಸಾಮಾಜಿಕ ಮತ್ತು ಸೇರ್ಪಡೆ"},
  d_affect: {"en":"Emotional wellbeing","hi":"भावनात्मक कल्याण","kn":"ಭಾವನಾತ್ಮಕ ಯೋಗಕ್ಷೇಮ"},
  d_academic: {"en":"Learning & work","hi":"सीखना व कार्य","kn":"ಕಲಿಕೆ ಮತ್ತು ಕೆಲಸ"},
  d_engagement: {"en":"Classroom engagement","hi":"कक्षा सहभागिता","kn":"ತರಗತಿ ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ"},
  rollnumber: {"en":"Roll number","hi":"क्रमांक","kn":"ಕ್ರಮಾಂಕ"},

  // ---- landing stat values -------------------------------------------------
  stat1v: {"en":"30–35 : 1","hi":"30–35 : 1","kn":"30–35 : 1"},
  stat2v: {"en":"~40 lakh","hi":"~40 लाख","kn":"~40 ಲಕ್ಷ"},
  stat3v: {"en":"1 in 7","hi":"7 में से 1","kn":"7ರಲ್ಲಿ 1"},
  stat4v: {"en":"~0","hi":"~0","kn":"~0"},

  // ---- app shell -----------------------------------------------------------
  role_teacher: {"en":"Class teacher","hi":"कक्षा शिक्षक","kn":"ತರಗತಿ ಶಿಕ್ಷಕರು"},
  role_admin: {"en":"Head teacher","hi":"प्रधान शिक्षक","kn":"ಮುಖ್ಯ ಶಿಕ್ಷಕರು"},
  signout: {"en":"Sign out","hi":"साइन आउट","kn":"ಸೈನ್ ಔಟ್"},
  openmenu: {"en":"Open menu","hi":"मेन्यू खोलें","kn":"ಮೆನು ತೆರೆಯಿರಿ"},
  closemenu: {"en":"Close menu","hi":"मेन्यू बंद करें","kn":"ಮೆನು ಮುಚ್ಚಿ"},

  // ---- this week -----------------------------------------------------------
  tw_kicker: {"en":"Monday morning · nothing else interrupts you","hi":"सोमवार की सुबह · और कुछ आपको नहीं टोकता","kn":"ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ · ಬೇರೇನೂ ನಿಮ್ಮನ್ನು ತಡೆಯುವುದಿಲ್ಲ"},
  tw_greet: {"en":"Good to see you,","hi":"आपको देखकर अच्छा लगा,","kn":"ನಿಮ್ಮನ್ನು ಕಂಡು ಸಂತೋಷ,"},
  tw_class: {"en":"Class","hi":"कक्षा","kn":"ತರಗತಿ"},
  tw_allclasses: {"en":"All classes.","hi":"सभी कक्षाएँ।","kn":"ಎಲ್ಲಾ ತರಗತಿಗಳು."},
  tw_stat_written: {"en":"noticings written in the last 7 days","hi":"पिछले 7 दिनों में लिखी गई टिप्पणियाँ","kn":"ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ ಬರೆದ ಟಿಪ್ಪಣಿಗಳು"},
  tw_stat_fading: {"en":"children not noticed in 6+ weeks","hi":"6+ सप्ताह से न देखे गए बच्चे","kn":"6+ ವಾರಗಳಿಂದ ಗಮನಿಸದ ಮಕ್ಕಳು"},
  tw_stat_invisible: {"en":"children with almost nothing on record","hi":"जिनके बारे में लगभग कुछ भी दर्ज नहीं है","kn":"ದಾಖಲೆಯಲ್ಲಿ ಬಹುತೇಕ ಏನೂ ಇಲ್ಲದ ಮಕ್ಕಳು"},
  tw_fading_title: {"en":"Might be fading","hi":"शायद ओझल हो रहे हैं","kn":"ಮರೆಯಾಗುತ್ತಿರಬಹುದು"},
  tw_fading_blurb: {"en":"Nobody has written about them for a while. That's about us, not about them.","hi":"काफ़ी समय से इनके बारे में किसी ने कुछ नहीं लिखा। यह हमारे बारे में है, इनके बारे में नहीं।","kn":"ಬಹಳ ಕಾಲದಿಂದ ಇವರ ಬಗ್ಗೆ ಯಾರೂ ಬರೆದಿಲ್ಲ. ಇದು ನಮ್ಮ ಬಗ್ಗೆ, ಅವರ ಬಗ್ಗೆ ಅಲ್ಲ."},
  tw_fading_empty: {"en":"Everyone has been noticed recently. Rare and lovely.","hi":"हाल ही में सभी को देखा गया है। दुर्लभ और सुंदर बात।","kn":"ಇತ್ತೀಚೆಗೆ ಎಲ್ಲರನ್ನೂ ಗಮನಿಸಲಾಗಿದೆ. ಅಪರೂಪದ ಒಳ್ಳೆಯ ಸಂಗತಿ."},
  tw_needs_title: {"en":"A run of concern","hi":"चिंता का सिलसिला","kn":"ಕಳವಳದ ಸರಣಿ"},
  tw_needs_blurb: {"en":"Three or more concerns written in the last three weeks.","hi":"पिछले तीन सप्ताह में तीन या अधिक चिंताएँ दर्ज हुईं।","kn":"ಕಳೆದ ಮೂರು ವಾರಗಳಲ್ಲಿ ಮೂರು ಅಥವಾ ಹೆಚ್ಚು ಕಳವಳಗಳು ದಾಖಲಾಗಿವೆ."},
  tw_needs_empty: {"en":"No recent runs of concern in this class.","hi":"इस कक्षा में हाल में चिंता का कोई सिलसिला नहीं।","kn":"ಈ ತರಗತಿಯಲ್ಲಿ ಇತ್ತೀಚೆಗೆ ಕಳವಳದ ಸರಣಿ ಇಲ್ಲ."},
  tw_concerns_count: {"en":"{n} concerns on record","hi":"{n} चिंताएँ दर्ज","kn":"{n} ಕಳವಳಗಳು ದಾಖಲಾಗಿವೆ"},
  btn_write: {"en":"Write a noticing","hi":"एक टिप्पणी लिखें","kn":"ಒಂದು ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ"},
  btn_openregister: {"en":"Open the register","hi":"रजिस्टर खोलें","kn":"ರಿಜಿಸ್ಟರ್ ತೆರೆಯಿರಿ"},

  // ---- quick capture + digest ---------------------------------------------
  qc_helper: {"en":"Type it the way you'd say it — Roshni will structure it for you.","hi":"जैसा कहेंगे वैसा लिखिए — रोशनी उसे व्यवस्थित कर देगी।","kn":"ನೀವು ಹೇಳುವಂತೆ ಬರೆಯಿರಿ — ರೋಶ್ನಿ ಅದನ್ನು ಕ್ರಮಬದ್ಧಗೊಳಿಸುತ್ತದೆ."},
  qc_placeholder: {"en":"Fatima was quiet all morning, one-word answers…","hi":"फ़ातिमा सुबह भर चुप रही, एक-शब्द के उत्तर…","kn":"ಫಾತಿಮಾ ಬೆಳಗಿನಿಂದ ಮೌನವಾಗಿದ್ದಳು, ಒಂದೇ ಪದದ ಉತ್ತರಗಳು…"},
  tag_quiet: {"en":"The quiet one","hi":"चुपचाप रहने वाला","kn":"ಮೌನವಾಗಿರುವ ಮಗು"},
  tag_lopsided: {"en":"Lopsided","hi":"एकतरफ़ा","kn":"ಏಕಪಕ್ಷೀಯ"},
  tag_cluster: {"en":"A cluster","hi":"एक झुंड","kn":"ಒಂದು ಗುಂಪು"},
  tag_worth: {"en":"Worth sending","hi":"भेजने योग्य","kn":"ಕಳುಹಿಸಲು ಯೋಗ್ಯ"},
  evidence: {"en":"Evidence","hi":"साक्ष्य","kn":"ಆಧಾರ"},
  open_child: {"en":"Open {name}","hi":"{name} को खोलें","kn":"{name} ಅವರನ್ನು ತೆರೆಯಿರಿ"},
  prepare_summary: {"en":"Prepare a summary →","hi":"सारांश तैयार करें →","kn":"ಸಾರಾಂಶ ಸಿದ್ಧಪಡಿಸಿ →"},
  digest_empty: {"en":"Nothing rose above the threshold this week. That is a valid result.","hi":"इस सप्ताह कुछ भी सीमा से ऊपर नहीं गया। यह भी एक वैध परिणाम है।","kn":"ಈ ವಾರ ಯಾವುದೂ ಮಿತಿಯನ್ನು ದಾಟಲಿಲ್ಲ. ಅದೂ ಒಂದು ಸರಿಯಾದ ಫಲಿತಾಂಶ."},

  // ---- last seen -----------------------------------------------------------
  ls_never: {"en":"never noticed","hi":"कभी नहीं देखा गया","kn":"ಎಂದೂ ಗಮನಿಸಿಲ್ಲ"},
  ls_today: {"en":"seen today","hi":"आज देखा गया","kn":"ಇಂದು ಗಮನಿಸಲಾಗಿದೆ"},
  ls_yesterday: {"en":"seen yesterday","hi":"कल देखा गया","kn":"ನಿನ್ನೆ ಗಮನಿಸಲಾಗಿದೆ"},
  ls_days: {"en":"{n} days ago","hi":"{n} दिन पहले","kn":"{n} ದಿನಗಳ ಹಿಂದೆ"},
  ls_months: {"en":"{n} months ago","hi":"{n} महीने पहले","kn":"{n} ತಿಂಗಳ ಹಿಂದೆ"},
  ls_month: {"en":"{n} month ago","hi":"{n} महीना पहले","kn":"{n} ತಿಂಗಳ ಹಿಂದೆ"},
  ls_over2y: {"en":"over 2 years ago","hi":"2 वर्ष से अधिक पहले","kn":"2 ವರ್ಷಗಳಿಗಿಂತ ಹಿಂದೆ"},

  // ---- notice composer -----------------------------------------------------
  nc_sub: {"en":"Type it the way you'd say it. Roshni will split it into clean, dated observations — nothing is saved until you approve every word.","hi":"जैसा कहेंगे वैसा लिखिए। रोशनी उसे साफ़, दिनांकित टिप्पणियों में बाँट देगी — जब तक आप हर शब्द को स्वीकृत न करें, कुछ भी सहेजा नहीं जाता।","kn":"ನೀವು ಹೇಳುವಂತೆ ಬರೆಯಿರಿ. ರೋಶ್ನಿ ಅದನ್ನು ಸ್ಪಷ್ಟ, ದಿನಾಂಕಿತ ಟಿಪ್ಪಣಿಗಳಾಗಿ ವಿಂಗಡಿಸುತ್ತದೆ — ನೀವು ಪ್ರತಿ ಪದವನ್ನು ಒಪ್ಪುವವರೆಗೆ ಏನೂ ಉಳಿಸಲಾಗುವುದಿಲ್ಲ."},
  nc_placeholder: {"en":"Fatima was quiet all morning, one-word answers. Arjun sat alone at lunch again…","hi":"फ़ातिमा सुबह भर चुप रही, एक-शब्द के उत्तर। अर्जुन फिर से दोपहर के भोजन में अकेला बैठा…","kn":"ಫಾತಿಮಾ ಬೆಳಗಿನಿಂದ ಮೌನವಾಗಿದ್ದಳು, ಒಂದೇ ಪದದ ಉತ್ತರಗಳು. ಅರ್ಜುನ್ ಮತ್ತೆ ಊಟದ ಹೊತ್ತಿನಲ್ಲಿ ಒಬ್ಬನೇ ಕುಳಿತಿದ್ದ…"},
  nc_chars: {"en":"{n} chars","hi":"{n} अक्षर","kn":"{n} ಅಕ್ಷರಗಳು"},
  nc_rule_b: {"en":"The one rule: observation, not interpretation.","hi":"एक ही नियम: व्याख्या नहीं, अवलोकन।","kn":"ಒಂದೇ ನಿಯಮ: ವ್ಯಾಖ್ಯಾನವಲ್ಲ, ಅವಲೋಕನ."},
  nc_rule_rest: {"en":"Describe what a child did, and when. Roshni will not save a character label, a diagnosis, a theory about a home, an identity remark, or medical detail.","hi":"बताइए कि बच्चे ने क्या किया और कब। रोशनी कोई चरित्र-लेबल, निदान, घर के बारे में अनुमान, पहचान संबंधी टिप्पणी या चिकित्सा विवरण नहीं सहेजेगी।","kn":"ಮಗು ಏನು ಮಾಡಿತು ಮತ್ತು ಯಾವಾಗ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ರೋಶ್ನಿ ಸ್ವಭಾವದ ಹಣೆಪಟ್ಟಿ, ರೋಗನಿರ್ಣಯ, ಮನೆಯ ಬಗ್ಗೆ ಊಹೆ, ಗುರುತಿನ ಟಿಪ್ಪಣಿ ಅಥವಾ ವೈದ್ಯಕೀಯ ವಿವರವನ್ನು ಉಳಿಸುವುದಿಲ್ಲ."},
  nc_nothingparsed: {"en":"Nothing parsed yet.","hi":"अभी कुछ भी विश्लेषित नहीं हुआ।","kn":"ಇನ್ನೂ ಏನೂ ವಿಶ್ಲೇಷಿಸಲಾಗಿಲ್ಲ."},
  nc_needsrewrite: {"en":"Needs a rewrite","hi":"फिर से लिखना होगा","kn":"ಮತ್ತೆ ಬರೆಯಬೇಕು"},
  nc_noticing_n: {"en":"Noticing {n}","hi":"टिप्पणी {n}","kn":"ಟಿಪ್ಪಣಿ {n}"},
  nc_approve: {"en":"Approve","hi":"स्वीकृत करें","kn":"ಅನುಮೋದಿಸಿ"},
  nc_nostudent: {"en":"No student matched. Pick one below, or add a first name.","hi":"कोई छात्र नहीं मिला। नीचे से चुनिए, या पहला नाम जोड़िए।","kn":"ಯಾವ ವಿದ್ಯಾರ್ಥಿಯೂ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ. ಕೆಳಗಿನಿಂದ ಆಯ್ಕೆಮಾಡಿ, ಅಥವಾ ಮೊದಲ ಹೆಸರು ಸೇರಿಸಿ."},
  nc_studentopt: {"en":"— student —","hi":"— छात्र —","kn":"— ವಿದ್ಯಾರ್ಥಿ —"},
  nc_roll: {"en":"Roll","hi":"क्रमांक","kn":"ಕ್ರಮಾಂಕ"},
  nc_strength: {"en":"Strength","hi":"क्षमता","kn":"ಸಾಮರ್ಥ್ಯ"},
  nc_concern: {"en":"Concern","hi":"चिंता","kn":"ಕಳವಳ"},
  nc_neutral: {"en":"Neutral","hi":"तटस्थ","kn":"ತಟಸ್ಥ"},
  nc_recheck: {"en":"Recheck","hi":"पुनः जाँचें","kn":"ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ"},
  nc_rewritten: {"en":"I've rewritten it — recheck","hi":"मैंने फिर से लिखा — पुनः जाँचें","kn":"ನಾನು ಮತ್ತೆ ಬರೆದಿದ್ದೇನೆ — ಪರಿಶೀಲಿಸಿ"},
  nc_retention: {"en":"Raw noticings are removed automatically after 24 months. Roshni never speaks to a child and never holds a diagnosis.","hi":"कच्ची टिप्पणियाँ 24 महीनों के बाद स्वतः हटा दी जाती हैं। रोशनी कभी किसी बच्चे से बात नहीं करती और कोई निदान नहीं रखती।","kn":"ಕಚ್ಚಾ ಟಿಪ್ಪಣಿಗಳು 24 ತಿಂಗಳ ನಂತರ ತಾನಾಗಿಯೇ ಅಳಿಸಲ್ಪಡುತ್ತವೆ. ರೋಶ್ನಿ ಎಂದೂ ಮಗುವಿನೊಂದಿಗೆ ಮಾತನಾಡುವುದಿಲ್ಲ ಮತ್ತು ಯಾವ ರೋಗನಿರ್ಣಯವನ್ನೂ ಇಟ್ಟುಕೊಳ್ಳುವುದಿಲ್ಲ."},
  nc_nothing_structure: {"en":"Nothing to structure","hi":"व्यवस्थित करने के लिए कुछ नहीं","kn":"ಕ್ರಮಬದ್ಧಗೊಳಿಸಲು ಏನೂ ಇಲ್ಲ"},
  nc_stillflagged: {"en":"Still flagged — describe what you saw.","hi":"अब भी चिह्नित है — जो आपने देखा वही लिखिए।","kn":"ಇನ್ನೂ ಗುರುತಿಸಲಾಗಿದೆ — ನೀವು ಕಂಡದ್ದನ್ನು ಬರೆಯಿರಿ."},
  nc_saved: {"en":"{n} noticings saved","hi":"{n} टिप्पणियाँ सहेजी गईं","kn":"{n} ಟಿಪ್ಪಣಿಗಳು ಉಳಿಸಲಾಗಿದೆ"},
  nc_nothing_approved: {"en":"Nothing approved yet","hi":"अभी कुछ भी स्वीकृत नहीं","kn":"ಇನ್ನೂ ಏನೂ ಅನುಮೋದಿಸಿಲ್ಲ"},

  // ---- guardrail messages --------------------------------------------------
  block_clinical: {"en":"Clinical language. Roshni does not hold diagnoses. Describe what you saw instead.","hi":"नैदानिक भाषा। रोशनी निदान नहीं रखती। इसके बजाय जो आपने देखा वह लिखिए।","kn":"ವೈದ್ಯಕೀಯ ಭಾಷೆ. ರೋಶ್ನಿ ರೋಗನಿರ್ಣಯಗಳನ್ನು ಇಟ್ಟುಕೊಳ್ಳುವುದಿಲ್ಲ. ಬದಲಾಗಿ ನೀವು ಕಂಡದ್ದನ್ನು ಬರೆಯಿರಿ."},
  block_character: {"en":"That is a character label, not an observation. What did the child actually do, and when?","hi":"यह चरित्र-लेबल है, अवलोकन नहीं। बच्चे ने वास्तव में क्या किया, और कब?","kn":"ಅದು ಸ್ವಭಾವದ ಹಣೆಪಟ್ಟಿ, ಅವಲೋಕನವಲ್ಲ. ಮಗು ನಿಜವಾಗಿ ಏನು ಮಾಡಿತು, ಮತ್ತು ಯಾವಾಗ?"},
  block_home: {"en":"A theory about the home. You may record what a child said to you, not what you imagine happens at home.","hi":"यह घर के बारे में अनुमान है। बच्चे ने आपसे जो कहा वह दर्ज कीजिए, न कि जो आप घर के बारे में सोचते हैं।","kn":"ಇದು ಮನೆಯ ಬಗ್ಗೆ ಊಹೆ. ಮಗು ನಿಮಗೆ ಹೇಳಿದ್ದನ್ನು ದಾಖಲಿಸಿ, ಮನೆಯಲ್ಲಿ ಏನಾಗುತ್ತದೆ ಎಂದು ನೀವು ಊಹಿಸುವುದನ್ನಲ್ಲ."},
  block_identity: {"en":"Caste, religion, community and appearance are never part of a pastoral record.","hi":"जाति, धर्म, समुदाय और रूप-रंग कभी भी इस देखभाल-रिकॉर्ड का हिस्सा नहीं होते।","kn":"ಜಾತಿ, ಧರ್ಮ, ಸಮುದಾಯ ಮತ್ತು ರೂಪ ಎಂದಿಗೂ ಈ ಆರೈಕೆ ದಾಖಲೆಯ ಭಾಗವಲ್ಲ."},
  block_medical: {"en":"Health and medical detail is out of scope by design. That belongs with the school office.","hi":"स्वास्थ्य और चिकित्सा विवरण जानबूझकर इसके दायरे से बाहर है। वह विद्यालय कार्यालय का विषय है।","kn":"ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ ವಿವರ ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ಈ ವ್ಯಾಪ್ತಿಯ ಹೊರಗಿದೆ. ಅದು ಶಾಲಾ ಕಚೇರಿಗೆ ಸೇರಿದ್ದು."},
} as const satisfies Record<string, { en: string; hi: string; kn: string }>;

export type TKey = keyof typeof DICTIONARY;

export function t(key: TKey | string, lang: Lang): string {
  const entry = (DICTIONARY as Record<string, { en: string; hi?: string; kn?: string }>)[key];
  if (!entry) return String(key);
  return entry[lang] ?? entry.en ?? String(key);
}

/** Fill {name}-style placeholders in a translated string. */
export function fill(s: string, params: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}
