import {
  SafetyGuide,
  SafetyProfile,
  SafetyCategoryKey,
  HazardSeverity,
  LanguageCode,
} from '../../types';

export const SAFETY_RULE_VERSION = 1;

/**
 * Deterministic Safety Rule Engine
 * Authoritative, practical, offline-first safety guidance for 10 electronic scrap categories.
 * No AI is used for baseline deterministic safety constraints.
 */

interface RawCategorySafety {
  key: SafetyCategoryKey;
  severity: HazardSeverity;
  isHazardous: boolean;
  icon: string;
  en: {
    title: string;
    warningBanner: string;
    doList: string[];
    dontList: string[];
    emergencyGuidance: string;
    audioGuidance: string;
  };
  hi: {
    title: string;
    warningBanner: string;
    doList: string[];
    dontList: string[];
    emergencyGuidance: string;
    audioGuidance: string;
  };
  mr: {
    title: string;
    warningBanner: string;
    doList: string[];
    dontList: string[];
    emergencyGuidance: string;
    audioGuidance: string;
  };
}

export const DETERMINISTIC_SAFETY_CATEGORIES: RawCategorySafety[] = [
  {
    key: 'battery',
    severity: 'high',
    isHazardous: true,
    icon: 'battery-alert-variant-outline',
    en: {
      title: 'Battery Safety',
      warningBanner: 'Handle Carefully: Battery - Do not burn, puncture, or crush.',
      doList: [
        'Keep damaged and swollen batteries separated',
        'Tape or insulate battery terminals to prevent short circuits',
        'Store batteries in a dry place far away from any open fire',
        'Handle leaking or corroded batteries with gloves',
        'Keep suspicious batteries in a cool, ventilated container',
      ],
      dontList: [
        'Do NOT burn batteries or throw them in scrap bonfires',
        'Do NOT puncture or drive nails into battery cells',
        'Do NOT intentionally crush or hammer batteries',
        'Do NOT casually dismantle or pry open lithium or lead batteries',
      ],
      emergencyGuidance: 'If battery smokes or gets hot, move away, place in sand or open dirt, and do not breathe fumes.',
      audioGuidance: 'Battery ko aag ke paas mat rakhiye. Fati ya fooli hui battery ko alag rakhein. Isse todna ya jalana bilkul mana hai.',
    },
    hi: {
      title: 'बैटरी सुरक्षा (Battery Safety)',
      warningBanner: 'सावधानी: बैटरी - इसे आग में न डालें, न तोड़ें और न ही पंचर करें।',
      doList: [
        'क्षतिग्रस्त या फूली हुई बैटरी को तुरंत बाकी स्क्रैप से अलग रखें',
        'बैटरी के दोनों सिरों (टर्मिनल्स) पर टेप लगाएं ताकि शॉर्ट सर्किट न हो',
        'बैटरी को आग, धूप और पानी से हमेशा दूर रखें',
        'लीक होने वाली बैटरी को दस्ताने पहनकर ही छुएं',
        'संदिग्ध बैटरी को सूखी और हवादार जगह पर रखें',
      ],
      dontList: [
        'बैटरी को कभी भी आग या भट्टी में न जलाएं (विस्फोट का खतरा)',
        'बैटरी को नुकीली चीज से न छेदें और न ही पंचर करें',
        'बैटरी पर हथौड़ा न मारें और न ही दबाएं',
        'बैटरी को घर पर कभी भी खोलने या काटने की कोशिश न करें',
      ],
      emergencyGuidance: 'अगर बैटरी से धुआं निकले या गर्म हो, तो तुरंत दूर हटें, उस पर सूखी रेत या मिट्टी डालें, पानी न डालें।',
      audioGuidance: 'बैटरी को कभी आग के पास मत रखिए। फूली या खराब बैटरी को अलग रखिए। बैटरी को हथौड़े से तोड़ना या जलाना सख्त मना है।',
    },
    mr: {
      title: 'बॅटरी सुरक्षा (Battery Safety)',
      warningBanner: 'काळजीपूर्वक हाताळा: बॅटरी - जाळू नका, फोडू नका आणि पंक्चर करू नका.',
      doList: [
        'खराब किंवा फुगलेली बॅटरी इतर भंगारापासून वेगळी ठेवा',
        'बॅटरीच्या टोकांवर टेप लावा जेणेकरून शॉर्ट सर्किट होणार नाही',
        'बॅटऱ्या आगीपासून आणि पाण्यापासून लांब कोरड्या जागी ठेवा',
        'गळती असलेल्या बॅटरीला हातमोजे घालूनच स्पर्श करा',
        'संशयास्पद बॅटरी हवेशीर आणि सुरक्षित ठिकाणी ठेवा',
      ],
      dontList: [
        'बॅटरी कधीही आगीत टाकू नका किंवा जाळू नका (स्फोटाचा धोका)',
        'बॅटरीमध्ये खिळा ठोकू नका किंवा पंक्चर करू नका',
        'बॅटरीवर हातोडी मारू नका किंवा चिरडू नका',
        'बॅटरी स्वतः उघडण्याचा किंवा तोडण्याचा प्रयत्न करू नका',
      ],
      emergencyGuidance: 'बॅटरीतून धूर निघत असल्यास लगेच दूर व्हा, त्यावर सुकी वाळू किंवा माती टाका.',
      audioGuidance: 'बॅटरी आगीजवळ ठेवू नका. खराब झालेली बॅटरी वेगळी ठेवा. बॅटरी फोडणे किंवा जाळणे धोकादायक आहे.',
    },
  },
  {
    key: 'crt',
    severity: 'high',
    isHazardous: true,
    icon: 'television-classic',
    en: {
      title: 'CRT Television / Monitor Glass Safety',
      warningBanner: 'Vacuum Tube Risk: CRT Glass contains vacuum and toxic phosphor powder.',
      doList: [
        'Handle CRT monitors and TVs with thick protective gloves',
        'Keep broken CRT glass pieces isolated in a heavy-duty container',
        'Wear eye safety glasses when moving bulky picture tubes',
        'Hand over intact CRT tubes directly to verified e-waste recyclers',
      ],
      dontList: [
        'Do NOT break or smash CRT glass intentionally (risk of vacuum implosion)',
        'Do NOT burn CRT screens or scrape interior chemical coatings',
        'Do NOT dump cracked glass in open garbage or drainage',
      ],
      emergencyGuidance: 'If tube cracks, step back immediately. Clean broken glass using a dustpan, never bare hands.',
      audioGuidance: 'CRT TV aur monitor ka kanch kabhi mat fodiye. Iske andar zehrila powder hota hai jo fefdo ke liye hanikarak hai.',
    },
    hi: {
      title: 'CRT स्क्रीन और कांच सुरक्षा (CRT Safety)',
      warningBanner: 'गंभीर चेतावनी: CRT कांच को न तोड़ें। इसमें वैक्यूम और जहरीला फॉस्फर पाउडर होता है।',
      doList: [
        'CRT टीवी और मॉनिटर को मोटे दस्ताने पहनकर ही उठाएं',
        'टूटे हुए कांच के टुकड़ों को मोटे कट्टे या बाल्टी में अलग रखें',
        'कांच संभालते समय आंखों की सुरक्षा के लिए चश्मा पहनें',
        'साबुत CRT सीधे रजिस्टर्ड रिसाइक्लर को ही सौंपें',
      ],
      dontList: [
        'CRT कांच को जानबूझकर कभी न फोड़ें (कांच तेजी से फट सकता है)',
        'CRT की स्क्रीन को आग में न जलाएं और न ही अंदर का पाउडर खुरचें',
        'टूटा कांच खुले में या नाले में कभी न फेंकें',
      ],
      emergencyGuidance: 'कांच फूटने पर तुरंत पीछे हटें। नंगे हाथों से कांच कभी न उठाएं, झाड़ू और सूपड़े का उपयोग करें।',
      audioGuidance: 'CRT टीवी या पुराने मॉनिटर का कांच कभी मत फोड़िए। इसके अंदर जहरीला पाउडर होता है। इसे सीधा रिसाइक्लर को दें।',
    },
    mr: {
      title: 'CRT स्क्रीन व काच सुरक्षा (CRT Safety)',
      warningBanner: 'धोकादायक: CRT काच फोडू नका. यात व्हॅक्यूम व विषारी फॉस्फर पावडर असते.',
      doList: [
        'CRT टीव्ही हाताळताना जाड हातमोजे वापरा',
        'फुटलेली काच वेगळ्या सुरक्षित पिशवीत किंवा डब्यात ठेवा',
        'डोळ्यांच्या संरक्षणासाठी गॉगल किंवा चष्मा वापरा',
        'अखंड CRT थेट अधिकृत रिसायकलर्सना द्या',
      ],
      dontList: [
        'CRT काच जाणूनबुजून फोडू नका (स्फोटाप्रमाणे काच उडू शकते)',
        'स्क्रीन आगीत जाळू नका आणि आतील पावडर खरवडू नका',
        'फुटलेली काच उघड्यावर फेकू नका',
      ],
      emergencyGuidance: 'काच फुटल्यास लगेच मागे व्हा. उघड्या हाताने काच उचलू नका.',
      audioGuidance: 'CRT टीव्हीची काच कधीही फोडू नका. यातील पावडर विषारी असते. सुरक्षितपणे रिसायकलरला द्या.',
    },
  },
  {
    key: 'lcd_panel',
    severity: 'medium',
    isHazardous: true,
    icon: 'monitor-screenshot',
    en: {
      title: 'LCD / Display Panel Safety',
      warningBanner: 'Handle Display Carefully: Backlight lamps may contain trace mercury.',
      doList: [
        'Keep flat screen panels upright and dry',
        'Store cracked screens separately in cardboard or bubble wrap',
        'Protect backlight tubes from snapping',
      ],
      dontList: [
        'Do NOT smash backlight tubes (CCFL tubes contain trace mercury)',
        'Do NOT burn plastic diffusers or liquid crystal layers',
      ],
      emergencyGuidance: 'If backlight lamp breaks, ventilate the room immediately and avoid inhaling dust.',
      audioGuidance: 'LCD panel ke peeche wali tube ko mat todiye. Usme mercury gas ho sakti hai.',
    },
    hi: {
      title: 'LCD और डिस्प्ले स्क्रीन सुरक्षा (LCD Safety)',
      warningBanner: 'ध्यान दें: LCD बैकलाइट ट्यूब को न तोड़ें। इसमें पारा (Mercury) हो सकता है।',
      doList: [
        'फ्लैट स्क्रीन पैनल्स को सीधा और सूखा रखें',
        'टूटी स्क्रीन को गत्ते या बोरी में लपेटकर अलग रखें',
        'पीछे की पतली लाइट ट्यूब को टूटने से बचाएं',
      ],
      dontList: [
        'बैकलाइट ट्यूब को कभी न तोड़ें या कुचलें',
        'स्क्रीन की प्लास्टिक शीट या लिक्विड क्रिस्टल को न जलाएं',
      ],
      emergencyGuidance: 'ट्यूब टूटने पर कमरे की खिड़कियां तुरंत खोलें और धूल में सांस न लें।',
      audioGuidance: 'LCD स्क्रीन की बैकलाइट ट्यूब को मत तोड़िए। टूटी स्क्रीन को सुरक्षित अलग रखिए।',
    },
    mr: {
      title: 'LCD आणि डिस्प्ले स्क्रीन सुरक्षा (LCD Safety)',
      warningBanner: 'काळजी घ्या: LCD बॅकलाईट ट्यूब फोडू नका, यात पारा असू शकतो.',
      doList: [
        'स्क्रीन उभी आणि कोरडी ठेवा',
        'फुटलेली स्क्रीन कागदी खोक्यात किंवा पोत्यात गुंडाळून ठेवा',
        'मागील पातळ लाईट नळ्या तुटणार नाहीत याची काळजी घ्या',
      ],
      dontList: [
        'बॅकलाईट नळ्या मुद्दाम फोडू नका',
        'प्लास्टिक आणि डिस्प्ले भाग आगीत जाळू नका',
      ],
      emergencyGuidance: 'ट्यूब फुटल्यास लगेच ताजी हवा येऊ द्या, धूर श्वसनात जाऊ देऊ नका.',
      audioGuidance: 'LCD स्क्रीनची मागील ट्यूब फोडू नका. सुरक्षितपणे हाताळा.',
    },
  },
  {
    key: 'pcb',
    severity: 'high',
    isHazardous: true,
    icon: 'chip',
    en: {
      title: 'PCB & Circuit Board Safety',
      warningBanner: 'Strict Warning: Never use acid leaching or open burning to extract gold/copper.',
      doList: [
        'Store circuit boards clean and dry',
        'Sort by board grade (motherboard, power supply, low grade)',
        'Hand over intact boards to authorized recyclers with proper extraction equipment',
      ],
      dontList: [
        'Do NOT use acid leaching (Nitric / Sulphuric acid destroys health and lungs)',
        'Do NOT burn PCBs to melt solder or burn epoxy resin',
        'Do NOT desolder components in unventilated rooms without exhaust',
      ],
      emergencyGuidance: 'In case of chemical burn or inhalation, wash skin with copious water and seek fresh air immediately.',
      audioGuidance: 'PCB ya circuit board par tezaab ya acid mat daliye aur na hi aag me jalaiye. Isse seedha certified recycler ko bechein.',
    },
    hi: {
      title: 'सर्किट बोर्ड (PCB) सुरक्षा',
      warningBanner: 'सख्त मनाही: तांबा या सोना निकालने के लिए तेज़ाब या आग का इस्तेमाल कभी न करें।',
      doList: [
        'सर्किट बोर्ड्स को सूखा और सुरक्षित रखें',
        'मदरबोर्ड और पावर सप्लाई बोर्ड को अलग-अलग छांटें',
        'साबुत बोर्ड केवल अधिकृत रिसाइक्लर को ही बेचें जो मशीनों से काम करते हैं',
      ],
      dontList: [
        'बोर्ड पर तेज़ाब (Acid Leaching) कभी न डालें (फेफड़े और आंखें खराब होती हैं)',
        'सोल्डर पिघलाने के लिए बोर्ड को आग में कभी न झोंकें',
        'बिना पंखे या मास्क के कभी भी गर्म न करें',
      ],
      emergencyGuidance: 'तेज़ाब लगने पर तुरंत 15 मिनट तक लगातार साफ पानी से धोएं और तुरंत डॉक्टर के पास जाएं।',
      audioGuidance: 'सर्किट बोर्ड पर तेजाब डालना या उसे आग में जलाना बहुत खतरनाक है। इसे सीधे अधिकृत रिसाइक्लर को ही दें।',
    },
    mr: {
      title: 'सर्किट बोर्ड (PCB) सुरक्षा',
      warningBanner: 'कडक इशारा: धातू काढण्यासाठी ॲसिड वापरू नका किंवा बोर्ड जाळू नका.',
      doList: [
        'सर्किट बोर्ड कोरडे व स्वच्छ ठेवा',
        'दर्जाप्रमाणे (मदरबोर्ड, साधे बोर्ड) वेगळे वर्गीकरण करा',
        'संपूर्ण बोर्ड अधिकृत रिसायकलर्सनाच विक्री करा',
      ],
      dontList: [
        'ॲसिडचा (Acid Leaching) वापर मुळीच करू नका',
        'राळ किंवा सोल्डर जाळण्यासाठी बोर्ड आगीत टाकू नका',
        'हवेशीर जागा नसल्यास गरम करू नका',
      ],
      emergencyGuidance: 'ॲसिडचा संपर्क आल्यास भरपूर पाण्याने धुवा आणि डॉक्टरांचा सल्ला घ्या.',
      audioGuidance: 'सर्किट बोर्डवर ॲसिड टाकू नका आणि ते जाळू नका. संपूर्ण बोर्ड अधिकृत रिसायकलरला द्या.',
    },
  },
  {
    key: 'cables',
    severity: 'high',
    isHazardous: true,
    icon: 'transit-connection-variant',
    en: {
      title: 'Cable & Wire Safety (No Burning)',
      warningBanner: 'DO NOT BURN CABLES: Open-air cable burning produces toxic cancer-causing fumes.',
      doList: [
        'Strip PVC insulation mechanically with a wire stripper or blade tool',
        'Sell cables with insulation directly to recyclers with wire granulator machines',
        'Bundle wires neatly by thickness',
      ],
      dontList: [
        'Do NOT burn cables in open air, yards, or bonfires',
        'Do NOT breathe the black toxic smoke from burning plastic insulation',
      ],
      emergencyGuidance: 'If smoke is inhaled, move to fresh open air immediately and drink clean water.',
      audioGuidance: 'Taro ko aag me mat jalaiye. Kaala dhuwan fefdo ke liye zehrila hai. Taar ko machine se cheelein ya seedha bechein.',
    },
    hi: {
      title: 'केबल व तार सुरक्षा (तार न जलाएं)',
      warningBanner: 'तार जलाना सख्त मना है: तार जलाने से जहरीला काला धुआं निकलता है जो फेफड़ों को नुकसान पहुंचाता है।',
      doList: [
        'तार की प्लास्टिक को कटर या छिलने वाले औजार से छीलें',
        'प्लास्टिक समेत तार सीधे रिसाइक्लर को बेचें जो मशीन से छिलते हैं',
        'पतले और मोटे तारों की अलग-अलग गड्डी बनाएं',
      ],
      dontList: [
        'तारों को कभी भी खुले में या आग लगाकर न जलाएं',
        'तार के काले धुएं में कभी सांस न लें (कैंसर और दमा का खतरा)',
      ],
      emergencyGuidance: 'धुआं सांस में जाने पर तुरंत ताजी हवा में जाएं और ठंडा पानी पिएं।',
      audioGuidance: 'तार को आग में कभी मत जलाइए। इसका काला धुआं फेफड़ों के लिए जहर है। तार को कटर से छीलें या सीधा बेचें।',
    },
    mr: {
      title: 'केबल आणि वायर सुरक्षा (वायर जाळू नका)',
      warningBanner: 'वायर जाळू नका: प्लास्टिक जळल्याने विषारी धूर होतो ज्यामुळे फुफ्फुसाचे आजार होतात.',
      doList: [
        'वायर सोलण्यासाठी कटर किंवा वायर स्ट्रिपर वापरा',
        'इन्स्युलेशनसह वायर्स थेट मशीन असलेल्या रिसायकलरला विका',
        'बारीक आणि जाड वायर्सचे वेगळे गठ्ठे करा',
      ],
      dontList: [
        'वायर्स उघड्यावर किंवा शेकोटीत जाळू नका',
        'काळ्या विषारी धुरामध्ये उभे राहू नका',
      ],
      emergencyGuidance: 'धूर पोटात गेल्यास लगेच मोकळ्या हवेत या आणि पाणी प्या.',
      audioGuidance: 'केबल्स आगीत जाळू नका. धूर आरोग्यासाठी घातक आहे. वायर कटरने सोला किंवा तशीच विका.',
    },
  },
  {
    key: 'unknown',
    severity: 'medium',
    isHazardous: false,
    icon: 'help-circle-outline',
    en: {
      title: 'Unknown Electronic Devices (Not Sure?)',
      warningBanner: 'Not sure about this item? Do NOT dismantle. Take a photo and ask AI or a verified recycler.',
      doList: [
        'Take a clear photo in daylight without opening the outer shell',
        'Tap "Not Sure?" to let ScrapDeal AI inspect possible materials',
        'Keep sealed and transport safely',
        'Consult a certified recycler before attempting handling',
      ],
      dontList: [
        'Do NOT dismantle, smash, or force open sealed unknown boxes',
        'Do NOT touch leaking fluids, powders, or unlabeled capacitors',
      ],
      emergencyGuidance: 'If unknown powder spills, do not touch. Cover with dry cloth and seek advice.',
      audioGuidance: 'Agar saman ki pehchan na ho, toh usey mat kholiye. Photo kheench kar AI ya recycler se poochiye.',
    },
    hi: {
      title: 'अज्ञात इलेक्ट्रॉनिक उपकरण (समझ नहीं आ रहा?)',
      warningBanner: 'सामान की पहचान नहीं है? इसे जबरन न खोलें। फोटो लें और AI या रिसाइक्लर की मदद लें।',
      doList: [
        'दिन की रोशनी में सामान का साफ फोटो लें',
        '"पता नहीं?" बटन दबाकर AI से संभावित धातु या श्रेणी जानें',
        'सामान को बंद हालत में ही सुरक्षित रखें',
        'संदेह होने पर पास के रजिस्टर्ड रिसाइक्लर से राय लें',
      ],
      dontList: [
        'पहचान न होने पर सामान को पेचकस या हथौड़े से जबरन न खोलें',
        'अज्ञात लिक्विड, रिसते हुए तरल या पाउडर को नंगे हाथों से न छुएं',
      ],
      emergencyGuidance: 'यदि कोई अनजान पाउडर या लिक्विड गिरे, तो उसे न छुएं, कपड़े से ढकें और सुरक्षित दूरी बनाएं।',
      audioGuidance: 'अगर आपको सामान की समझ नहीं आ रही, तो उसे खोलिए मत। उसका फोटो खींचकर AI या रिसाइक्लर की मदद लीजिए।',
    },
    mr: {
      title: 'अनोळखी इलेक्ट्रॉनिक वस्तू (माहिती नाही?)',
      warningBanner: 'वस्तू माहित नाही? ती उघडू नका. फोटो काढून AI किंवा रिसायकलरची मदत घ्या.',
      doList: [
        'वस्तूचा स्पष्ट फोटो काढा',
        '"माहित नाही" पर्यायावर टॅप करून AI ची मदत घ्या',
        'वस्तू बंद स्थितीतच सुरक्षित ठेवा',
        'संशय असल्यास नोंदणीकृत रिसायकलरचा सल्ला घ्या',
      ],
      dontList: [
        'माहित नसलेली वस्तू हातोडीने किंवा स्क्रू ड्रायव्हरने फोडू नका',
        'गळणारे द्रव किंवा पावडर उघड्या हाताने स्पर्श करू नका',
      ],
      emergencyGuidance: 'अनोळखी रसायन किंवा पावडर सांडल्यास हात लावू नका, सुरक्षित अंतर ठेवा.',
      audioGuidance: 'वस्तूची ओळख नसल्यास ती उघडू नका. फोटो काढून सल्ला घ्या.',
    },
  },
  {
    key: 'sharp_metals',
    severity: 'medium',
    isHazardous: true,
    icon: 'knife',
    en: {
      title: 'Sharp Metal Sheets & Edges',
      warningBanner: 'Cut Hazard: Sharp chassis edges and cut sheets can cause deep wounds.',
      doList: [
        'Wear reinforced leather or cut-resistant gloves',
        'Bend or tape sharp protruding edges inwards before stacking',
        'Wear hard-sole safety shoes while handling heavy scrap',
      ],
      dontList: [
        'Do NOT carry unbundled sharp sheet scrap under bare arms',
        'Do NOT throw sheet scrap onto open cart without protective gear',
      ],
      emergencyGuidance: 'In case of a deep cut, apply direct firm pressure with clean cloth and seek a tetanus shot promptly.',
      audioGuidance: 'Dhaardar loha aur patti uthate waqt ch चमड़े ke dastane pehniye. Dhaar ko andar mod dijiye.',
    },
    hi: {
      title: 'नुकीली धातु व चद्दर सुरक्षा (Sharp Metals)',
      warningBanner: 'कटने का खतरा: धारदार लोहे की चद्दर और किनारे गहरे घाव कर सकते हैं।',
      doList: [
        'लोहे की चद्दर उठाते समय हमेशा मोटे चमड़े के दस्ताने पहनें',
        'उभरे हुए नुकीले किनारों को हथौड़े से अंदर की ओर मोड़ दें',
        'पैरों में मजबूत जूते पहनें ताकि कोई कील या चद्दर न चुभे',
      ],
      dontList: [
        'नंगे हाथों या कांख में दबाकर खुली चद्दर कभी न उठाएं',
        'गाड़ी पर बिना दस्ताने पहने धारदार कतरन न फेंकें',
      ],
      emergencyGuidance: 'कटने पर तुरंत साफ कपड़े से दबाकर खून रोकें और टिटनेस का इंजेक्शन लगवाएं।',
      audioGuidance: 'धारदार चद्दर और लोहे को हमेशा मोटे दस्ताने पहनकर उठाइए। पैरों में जूते जरूर पहनें।',
    },
    mr: {
      title: 'धारदार धातू व पत्रा सुरक्षा (Sharp Metals)',
      warningBanner: 'कापण्याचा धोका: पत्र्याचे टोक आणि धारदार भाग गंभीर इजा करू शकतात.',
      doList: [
        'जाड चामड्याचे हातमोजे वापरा',
        'धारदार टोक हातोडीने आतल्या बाजूला दुमडून घ्या',
        'पायात मजबूत बूट वापरा',
      ],
      dontList: [
        'उघड्या हाताने किंवा बगलेत धरून पत्रा वाहून नेऊ नका',
        'सुरक्षा साहित्याशिवाय धारदार भंगार उचलू नका',
      ],
      emergencyGuidance: 'जखम झाल्यास स्वच्छ कापडाने दाबून धरा आणि टिटॅनसचे इंजेक्शन घ्या.',
      audioGuidance: 'धारदार पत्रा हाताळताना जाड हातमोजे वापरा आणि टोक आत वळवा.',
    },
  },
  {
    key: 'broken_parts',
    severity: 'low',
    isHazardous: false,
    icon: 'puzzle-outline',
    en: {
      title: 'Broken Plastic & Component Safety',
      warningBanner: 'Handle cracked chassis and broken plastic casings with care.',
      doList: [
        'Bag fragmented plastics to prevent scattering',
        'Separate metal fasteners from plastic casings',
      ],
      dontList: [
        'Do NOT burn brittle plastics to test type',
        'Do NOT leave jagged plastic fragments on public roads',
      ],
      emergencyGuidance: 'Wear safety gloves when collecting scattered fragments.',
      audioGuidance: 'Toote hue plastic ko bori me baandh kar rakhein. Plastic ko jala kar test mat kijiye.',
    },
    hi: {
      title: 'टूटे हुए प्लास्टिक व पुर्जे सुरक्षा',
      warningBanner: 'टूटे हुए प्लास्टिक और बिखरे पुर्जों को संभालकर रखें।',
      doList: [
        'टूटे प्लास्टिक के टुकड़ों को बोरी में भरकर बांध लें',
        'प्लास्टिक और लोहे के पेंच अलग-अलग करें',
      ],
      dontList: [
        'प्लास्टिक की पहचान के लिए उसे माचिस से जलाकर सूंघने की गलती न करें',
        'रास्ते पर नुकीले टुकड़े न छोड़ें',
      ],
      emergencyGuidance: 'टुकड़े उठाते समय हाथ में दस्ताने जरूर पहनें।',
      audioGuidance: 'टूटे प्लास्टिक को बोरी में भरकर रखिए। प्लास्टिक को माचिस से जलाकर चेक मत कीजिए।',
    },
    mr: {
      title: 'तुटलेले प्लास्टिक व भाग सुरक्षा',
      warningBanner: 'तुटलेले प्लास्टिक आणि सुटे भाग व्यवस्थित गोळा करा.',
      doList: [
        'तुटलेले प्लास्टिक पोत्यात भरून ठेवा',
        'स्क्रू आणि धातू वेगळा करा',
      ],
      dontList: [
        'प्लास्टिक प्रकार तपासण्यासाठी ते जाळू नका',
        'रस्त्यावर तीक्ष्ण तुकडे सोडू नका',
      ],
      emergencyGuidance: 'तुकडे गोळा करताना हातमोजे घाला.',
      audioGuidance: 'तुटलेले प्लास्टिक पोत्यात बांधून ठेवा. ते जाळू नका.',
    },
  },
  {
    key: 'chemicals',
    severity: 'high',
    isHazardous: true,
    icon: 'flask-round-bottom-empty',
    en: {
      title: 'Chemical & Electrolyte Exposure',
      warningBanner: 'Dangerous Chemicals: Capacitors, transformers, and toners contain toxic oils and dust.',
      doList: [
        'Keep large capacitors and oily transformers upright',
        'Seal leaking transformer fluid in a closed bucket',
        'Wear a dust mask when handling loose printer toner cartridges',
      ],
      dontList: [
        'Do NOT drain transformer oil into soil or sewer',
        'Do NOT inhale fine printer toner powder (damages respiratory tract)',
      ],
      emergencyGuidance: 'If chemicals touch skin, wash with cold running water for 15 minutes. Do not rub eyes.',
      audioGuidance: 'Transformer ke tel aur printer ke toner ko haath se mat chhuein. Chemical ko naali me mat bahaiye.',
    },
    hi: {
      title: 'रसायन और ट्रांसफार्मर ऑयल सुरक्षा',
      warningBanner: 'जहरीले रसायन: बड़े कंडेंसर, ट्रांसफार्मर तेल और प्रिंटर टोनर से दूर रहें।',
      doList: [
        'तेल वाले ट्रांसफार्मर को सीधा रखें ताकि रिसाव न हो',
        'लीक होने वाले तेल को बंद बाल्टी में सुरक्षित रखें',
        'प्रिंटर कार्ट्रिज या टोनर संभालते समय मास्क या गमछा लगाएं',
      ],
      dontList: [
        'ट्रांसफार्मर के तेल को जमीन या नाली में कभी न बहाएं',
        'प्रिंटर के काले पाउडर (टोनर) को सूंघने से बचें',
      ],
      emergencyGuidance: 'रसायन लगने पर 15 मिनट तक बहते ठंडे पानी से धोएं, आंखें न मलें।',
      audioGuidance: 'ट्रांसफार्मर के तेल और प्रिंटर के काले पाउडर को हाथ से मत छुइए। इसे कभी नाली में मत बहाइए।',
    },
    mr: {
      title: 'रसायने आणि ऑइल सुरक्षा',
      warningBanner: 'विषारी रसायने: ट्रान्सफॉर्मर ऑइल आणि प्रिंटर टोनर पावडरपासून सावध रहा.',
      doList: [
        'तेल गळती टाळण्यासाठी ट्रान्सफॉर्मर सरळ ठेवा',
        'गळणारे तेल बादलीत बंद करून ठेवा',
        'टोनर हाताळताना तोंडावर रुमाल किंवा मास्क लावा',
      ],
      dontList: [
        'ट्रान्सफॉर्मरचे ऑइल जमिनीत किंवा गटारात सोडू नका',
        'काळ्या टोनर पावडरचा धूर नाकात जाऊ देऊ नका',
      ],
      emergencyGuidance: 'रसायन अंगावर पडल्यास भरपूर पाण्याने धुवा.',
      audioGuidance: 'ट्रान्सफॉर्मरचे ऑइल व टोनर उघड्या हाताने हाताळू नका.',
    },
  },
  {
    key: 'fire_hazard',
    severity: 'high',
    isHazardous: true,
    icon: 'fire-alert',
    en: {
      title: 'Fire & Smoke Prevention',
      warningBanner: 'High Fire Risk: Keep scrap yards free of cigarette butts, matches, and bonfires.',
      doList: [
        'Keep dry sand buckets or a portable fire extinguisher accessible in scrap collection area',
        'Store paper, cardboard, and dry plastics away from charging or battery zones',
        'Disconnect all power plugs before cutting cords',
      ],
      dontList: [
        'Do NOT smoke bidis or cigarettes near scrap piles',
        'Do NOT light open fires to stay warm next to scrap storage',
      ],
      emergencyGuidance: 'In case of fire, evacuate immediately and call emergency service 101/112.',
      audioGuidance: 'Bhangar ke paas bidi ya aag mat jalaiye. Paas me ret ya paani ki baalti zaroor rakhein.',
    },
    hi: {
      title: 'आग व धुआं रोकथाम (Fire Hazard)',
      warningBanner: 'आग का खतरा: कबाड़ के पास कभी भी बीड़ी, माचिस या अलाव न जलाएं।',
      doList: [
        'कबाड़ के पास हमेशा सूखी रेत या पानी से भरी बाल्टी तैयार रखें',
        'कागज, गत्ता और प्लास्टिक को बैटरी वाले हिस्से से दूर रखें',
        'तार काटने से पहले प्लग को सॉकेट से अलग कर लें',
      ],
      dontList: [
        'कबाड़ के ढेर के पास कभी बीड़ी या सिगरेट न पिएं',
        'ठंड में कबाड़ के पास कचरा जलाकर आग न सेकें',
      ],
      emergencyGuidance: 'आग लगने पर तुरंत सुरक्षित बाहर निकलें और 101/112 पर कॉल करें।',
      audioGuidance: 'कबाड़ के पास बीड़ी या माचिस मत जलाइए। आग बुझाने के लिए रेत या पानी की बाल्टी पास में रखें।',
    },
    mr: {
      title: 'आग आणि धूर प्रतिबंध (Fire Hazard)',
      warningBanner: 'आगीचा धोका: भंगाराजवळ विडी, सिगारेट किंवा आग पेटवू नका.',
      doList: [
        'भंगाराच्या गोदामात वाळूची किंवा पाण्याची बादली ठेवा',
        'कागद व प्लास्टिक बॅटरी विभागापासून लांब ठेवा',
        'वायर कापण्यापूर्वी प्लग बाहेर काढा',
      ],
      dontList: [
        'भंगाराजवळ विडी किंवा सिगारेट ओढू नका',
        'थंडीत शेकोटी पेटवून भंगाराजवळ बसू नका',
      ],
      emergencyGuidance: 'आग लागल्यास लगेच सुरक्षित ठिकाणी जा आणि १०१/११२ वर फोन करा.',
      audioGuidance: 'भंगाराजवळ विडी किंवा आग पेटवू नका. वाळूची बादली तयार ठेवा.',
    },
  },
];

/**
 * Normalizes input material string into a known SafetyCategoryKey.
 */
export function normalizeSafetyCategory(categoryInput: string): SafetyCategoryKey {
  const norm = (categoryInput || '').toLowerCase().trim();
  if (norm.includes('battery') || norm === 'batt') return 'battery';
  if (norm.includes('crt') || norm.includes('tv')) return 'crt';
  if (norm.includes('lcd') || norm.includes('monitor') || norm.includes('display')) return 'lcd_panel';
  if (norm.includes('pcb') || norm.includes('circuit') || norm.includes('motherboard')) return 'pcb';
  if (norm.includes('wire') || norm.includes('cable')) return 'cables';
  if (norm.includes('sharp') || norm.includes('iron') || norm.includes('steel') || norm.includes('sheet') || norm.includes('magnet')) {
    return 'sharp_metals';
  }
  if (norm.includes('chemical') || norm.includes('oil') || norm.includes('toner') || norm.includes('e_waste')) {
    return 'chemicals';
  }
  if (norm.includes('fire') || norm.includes('smoke') || norm.includes('burning')) {
    return 'fire_hazard';
  }
  if (norm.includes('broken') || norm.includes('plastic')) {
    return 'broken_parts';
  }
  return 'unknown';
}

/**
 * Checks whether a material category is considered hazardous and requires a safety warning.
 */
export function isHazardousCategory(categoryInput: string): boolean {
  const key = normalizeSafetyCategory(categoryInput);
  const found = DETERMINISTIC_SAFETY_CATEGORIES.find((c) => c.key === key);
  return found ? found.isHazardous : false;
}

/**
 * Retrieves deterministic safety profile for a material category and language.
 */
export function getSafetyProfile(categoryInput: string, lang: LanguageCode = 'hi'): SafetyProfile {
  const key = normalizeSafetyCategory(categoryInput);
  const item = DETERMINISTIC_SAFETY_CATEGORIES.find((c) => c.key === key) || DETERMINISTIC_SAFETY_CATEGORIES[5]; // fallback to unknown

  const langKey = (lang === 'mr' || lang === 'en') ? lang : 'hi';
  const content = item[langKey];

  return {
    materialCategory: item.key,
    title: content.title,
    hazardLevel: item.severity,
    isHazardous: item.isHazardous,
    warningBanner: content.warningBanner,
    doList: content.doList,
    dontList: content.dontList,
    emergencyGuidance: content.emergencyGuidance,
    audioGuidance: content.audioGuidance,
    icon: item.icon,
  };
}

/**
 * Pre-bundles all localized SafetyGuide entities ready for local caching in SQLite and offline view.
 */
export function getAllBundledSafetyGuides(lang: LanguageCode = 'hi'): SafetyGuide[] {
  const langKey = (lang === 'mr' || lang === 'en') ? lang : 'hi';
  return DETERMINISTIC_SAFETY_CATEGORIES.map((item) => {
    const c = item[langKey];
    return {
      id: `guide_${item.key}_${langKey}_v${SAFETY_RULE_VERSION}`,
      materialCategory: item.key,
      title: c.title,
      severity: item.severity,
      doItems: c.doList,
      dontItems: c.dontList,
      imageReferences: [`assets/safety/${item.key}.png`],
      audioReferences: [`assets/audio/${item.key}_${langKey}.mp3`],
      language: langKey,
      version: SAFETY_RULE_VERSION,
      updatedAt: '2026-09-30T00:00:00.000Z',
    };
  });
}
