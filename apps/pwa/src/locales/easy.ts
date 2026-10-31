import { adminTranslations } from './admin';
/** Interface copy only: record contents and identifiers are never translated. */
export const easyTranslations: Record<string, readonly [string, string]> = {
  'Open a record, or choose New and then Student or Patient.': [
    'रिकॉर्ड खोलें, या नया चुनकर विद्यार्थी अथवा रोगी चुनें।',
    'ਰਿਕਾਰਡ ਖੋਲ੍ਹੋ, ਜਾਂ ਨਵਾਂ ਚੁਣ ਕੇ ਵਿਦਿਆਰਥੀ ਜਾਂ ਮਰੀਜ਼ ਚੁਣੋ।',
  ],
  ...adminTranslations,
  'Add a child': ['बच्चा जोड़ें', 'ਬੱਚਾ ਜੋੜੋ'],
  'Enter a child’s details and guardian consent.': [
    'बच्चे का विवरण और अभिभावक की सहमति दर्ज करें।',
    'ਬੱਚੇ ਦਾ ਵੇਰਵਾ ਅਤੇ ਸਰਪ੍ਰਸਤ ਦੀ ਸਹਿਮਤੀ ਦਰਜ ਕਰੋ।',
  ],
  'Mark attendance': ['हाज़िरी लगाएँ', 'ਹਾਜ਼ਰੀ ਲਗਾਓ'],
  'Choose the class and date, then mark each child.': [
    'कक्षा और तारीख चुनें, फिर हर बच्चे की हाज़िरी लगाएँ।',
    'ਜਮਾਤ ਅਤੇ ਤਾਰੀਖ ਚੁਣੋ, ਫਿਰ ਹਰ ਬੱਚੇ ਦੀ ਹਾਜ਼ਰੀ ਲਗਾਓ।',
  ],
  'Enter marks': ['अंक दर्ज करें', 'ਅੰਕ ਦਰਜ ਕਰੋ'],
  'Record assessment scores or finish saved drafts.': [
    'मूल्यांकन के अंक दर्ज करें या अधूरी प्रविष्टियाँ पूरी करें।',
    'ਮੁਲਾਂਕਣ ਦੇ ਅੰਕ ਦਰਜ ਕਰੋ ਜਾਂ ਅਧੂਰੀਆਂ ਐਂਟਰੀਆਂ ਪੂਰੀਆਂ ਕਰੋ।',
  ],
  'Add a health visit': ['स्वास्थ्य मुलाकात जोड़ें', 'ਸਿਹਤ ਮੁਲਾਕਾਤ ਜੋੜੋ'],
  'Select a child and record the visit details.': [
    'बच्चा चुनें और मुलाकात का विवरण दर्ज करें।',
    'ਬੱਚਾ ਚੁਣੋ ਅਤੇ ਮੁਲਾਕਾਤ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ।',
  ],
  'Open learning activities': ['सीखने की गतिविधियाँ खोलें', 'ਸਿੱਖਣ ਦੀਆਂ ਗਤੀਵਿਧੀਆਂ ਖੋਲ੍ਹੋ'],
  'Read a lesson or try a practice activity.': ['पाठ पढ़ें या अभ्यास करें।', 'ਪਾਠ ਪੜ੍ਹੋ ਜਾਂ ਅਭਿਆਸ ਕਰੋ।'],
  'Find a child': ['बच्चा खोजें', 'ਬੱਚਾ ਲੱਭੋ'],
  'Search saved children and open their records.': [
    'सहेजे गए बच्चों को खोजें और उनका रिकॉर्ड खोलें।',
    'ਸੰਭਾਲੇ ਬੱਚਿਆਂ ਨੂੰ ਲੱਭੋ ਅਤੇ ਉਨ੍ਹਾਂ ਦਾ ਰਿਕਾਰਡ ਖੋਲ੍ਹੋ।',
  ],
  'Hello, {name}': ['नमस्ते, {name}', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, {name}'],
  'Welcome back': ['फिर से स्वागत है', 'ਮੁੜ ਜੀ ਆਇਆਂ ਨੂੰ'],
  'What would you like to do?': ['आप क्या करना चाहेंगे?', 'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?'],
  'Choose an activity. Your entries save on this device, even without a connection.': [
    'एक गतिविधि चुनें। इंटरनेट न होने पर भी आपकी प्रविष्टियाँ इस डिवाइस पर सहेजी जाती हैं।',
    'ਇੱਕ ਗਤੀਵਿਧੀ ਚੁਣੋ। ਕਨੈਕਸ਼ਨ ਨਾ ਹੋਣ ਉੱਤੇ ਵੀ ਤੁਹਾਡੀਆਂ ਐਂਟਰੀਆਂ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।',
  ],
  'Records need attention': ['रिकॉर्ड की जाँच ज़रूरी है', 'ਰਿਕਾਰਡਾਂ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ'],
  'Some changes need a person to check them': [
    'कुछ बदलावों की किसी व्यक्ति को जाँच करनी होगी',
    'ਕੁਝ ਬਦਲਾਵਾਂ ਦੀ ਕਿਸੇ ਵਿਅਕਤੀ ਨੂੰ ਜਾਂਚ ਕਰਨੀ ਪਵੇਗੀ',
  ],
  '{count} difference needs review.': ['{count} अंतर की जाँच ज़रूरी है।', '{count} ਫ਼ਰਕ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ।'],
  '{count} differences need review.': [
    '{count} अंतरों की जाँच ज़रूरी है।',
    '{count} ਫ਼ਰਕਾਂ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ।',
  ],
  '{count} submitted changes were set aside by the hub.': [
    'भेजे गए {count} बदलाव हब ने अलग रखे हैं।',
    'ਭੇਜੇ ਗਏ {count} ਬਦਲਾਅ ਹੱਬ ਨੇ ਵੱਖ ਰੱਖੇ ਹਨ।',
  ],
  'The original entries are kept.': ['मूल प्रविष्टियाँ सुरक्षित हैं।', 'ਅਸਲ ਐਂਟਰੀਆਂ ਸੰਭਾਲੀਆਂ ਹੋਈਆਂ ਹਨ।'],
  'Review differences': ['अंतर जाँचें', 'ਫ਼ਰਕਾਂ ਦੀ ਜਾਂਚ ਕਰੋ'],
  'Check changes set aside': ['अलग रखे गए बदलाव जाँचें', 'ਵੱਖ ਰੱਖੇ ਬਦਲਾਅ ਜਾਂਚੋ'],
  'Choose an activity': ['गतिविधि चुनें', 'ਗਤੀਵਿਧੀ ਚੁਣੋ'],
  'Continue entering marks': ['अंक दर्ज करना जारी रखें', 'ਅੰਕ ਦਰਜ ਕਰਨਾ ਜਾਰੀ ਰੱਖੋ'],
  '{count} unfinished score entry is kept encrypted on this device. Finish it to record the score.': [
    'अंक की {count} अधूरी प्रविष्टि इस डिवाइस पर एन्क्रिप्ट करके रखी है। अंक दर्ज करने के लिए उसे पूरा करें।',
    'ਅੰਕ ਦੀ {count} ਅਧੂਰੀ ਐਂਟਰੀ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਇਨਕ੍ਰਿਪਟ ਕਰਕੇ ਰੱਖੀ ਹੈ। ਅੰਕ ਦਰਜ ਕਰਨ ਲਈ ਇਸ ਨੂੰ ਪੂਰਾ ਕਰੋ।',
  ],
  '{count} unfinished score entries are kept encrypted on this device. Finish them to record the scores.': [
    'अंकों की {count} अधूरी प्रविष्टियाँ इस डिवाइस पर एन्क्रिप्ट करके रखी हैं। अंक दर्ज करने के लिए उन्हें पूरा करें।',
    'ਅੰਕਾਂ ਦੀਆਂ {count} ਅਧੂਰੀਆਂ ਐਂਟਰੀਆਂ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਇਨਕ੍ਰਿਪਟ ਕਰਕੇ ਰੱਖੀਆਂ ਹਨ। ਅੰਕ ਦਰਜ ਕਰਨ ਲਈ ਉਨ੍ਹਾਂ ਨੂੰ ਪੂਰਾ ਕਰੋ।',
  ],
  'On this device today': ['आज इस डिवाइस पर', 'ਅੱਜ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ'],
  'children in the active list': ['सक्रिय सूची में बच्चे', 'ਸਰਗਰਮ ਸੂਚੀ ਵਿੱਚ ਬੱਚੇ'],
  '{marked} of {total}': ['{total} में से {marked}', '{total} ਵਿੱਚੋਂ {marked}'],
  'attendance entries checked for today': [
    'आज की जाँची गई हाज़िरी प्रविष्टियाँ',
    'ਅੱਜ ਲਈ ਜਾਂਚੀਆਂ ਹਾਜ਼ਰੀ ਐਂਟਰੀਆਂ',
  ],
  'changes waiting to copy to the hub': [
    'हब पर कॉपी होने की प्रतीक्षा में बदलाव',
    'ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਹੋਣ ਦੀ ਉਡੀਕ ਵਿੱਚ ਬਦਲਾਅ',
  ],
  'Where are my records?': ['मेरे रिकॉर्ड कहाँ हैं?', 'ਮੇਰੇ ਰਿਕਾਰਡ ਕਿੱਥੇ ਹਨ?'],
  'See saving details': ['सहेजने का विवरण देखें', 'ਸੰਭਾਲਣ ਦਾ ਵੇਰਵਾ ਵੇਖੋ'],
  'Saved here': ['यहाँ सहेजे गए', 'ਇੱਥੇ ਸੰਭਾਲੇ ਗਏ'],
  'After a successful save, your entry is encrypted on this device. Keep using this browser to find it again.':
    [
      'सफलतापूर्वक सहेजने के बाद आपकी प्रविष्टि इस डिवाइस पर एन्क्रिप्ट रहती है। उसे फिर देखने के लिए यही ब्राउज़र इस्तेमाल करें।',
      'ਸਫਲਤਾਪੂਰਵਕ ਸੰਭਾਲਣ ਮਗਰੋਂ ਤੁਹਾਡੀ ਐਂਟਰੀ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਇਨਕ੍ਰਿਪਟ ਰਹਿੰਦੀ ਹੈ। ਇਸ ਨੂੰ ਮੁੜ ਲੱਭਣ ਲਈ ਇਹੀ ਬ੍ਰਾਊਜ਼ਰ ਵਰਤੋ।',
    ],
  'Copied to village hub': ['गाँव के हब पर कॉपी किए गए', 'ਪਿੰਡ ਦੇ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕੀਤੇ ਗਏ'],
  'Last completed copy: {date}.': ['पिछली पूरी हुई कॉपी: {date}।', 'ਪਿਛਲੀ ਪੂਰੀ ਹੋਈ ਕਾਪੀ: {date}।'],
  'This workspace has not completed a copy to the hub yet.': [
    'इस कार्यक्षेत्र से हब पर अभी तक कॉपी पूरी नहीं हुई है।',
    'ਇਸ ਵਰਕਸਪੇਸ ਤੋਂ ਹੱਬ ਉੱਤੇ ਹਾਲੇ ਕਾਪੀ ਪੂਰੀ ਨਹੀਂ ਹੋਈ।',
  ],
  '{count} newer change is still waiting.': [
    '{count} नया बदलाव अभी प्रतीक्षा में है।',
    '{count} ਨਵਾਂ ਬਦਲਾਅ ਹਾਲੇ ਉਡੀਕ ਵਿੱਚ ਹੈ।',
  ],
  '{count} newer changes are still waiting.': [
    '{count} नए बदलाव अभी प्रतीक्षा में हैं।',
    '{count} ਨਵੇਂ ਬਦਲਾਅ ਹਾਲੇ ਉਡੀਕ ਵਿੱਚ ਹਨ।',
  ],
  'No local changes are waiting to copy.': [
    'कोई स्थानीय बदलाव कॉपी होने की प्रतीक्षा में नहीं है।',
    'ਕੋਈ ਸਥਾਨਕ ਬਦਲਾਅ ਕਾਪੀ ਹੋਣ ਦੀ ਉਡੀਕ ਵਿੱਚ ਨਹੀਂ ਹੈ।',
  ],
  'Connect and copy your changes when the village hub is reachable.': [
    'गाँव का हब उपलब्ध होने पर जुड़ें और अपने बदलाव कॉपी करें।',
    'ਪਿੰਡ ਦਾ ਹੱਬ ਉਪਲਬਧ ਹੋਣ ਉੱਤੇ ਜੁੜੋ ਅਤੇ ਆਪਣੇ ਬਦਲਾਅ ਕਾਪੀ ਕਰੋ।',
  ],
  'You are offline': ['आप ऑफ़लाइन हैं', 'ਤੁਸੀਂ ਆਫ਼ਲਾਈਨ ਹੋ'],
  'Copying changes…': ['बदलाव कॉपी हो रहे हैं…', 'ਬਦਲਾਅ ਕਾਪੀ ਹੋ ਰਹੇ ਹਨ…'],
  'Ready to try a connection': ['कनेक्शन की कोशिश के लिए तैयार', 'ਕਨੈਕਸ਼ਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਲਈ ਤਿਆਰ'],
  'You can still enter records. Copy them when the hub is reachable.': [
    'आप अभी भी रिकॉर्ड दर्ज कर सकते हैं। हब उपलब्ध होने पर उन्हें कॉपी करें।',
    'ਤੁਸੀਂ ਹਾਲੇ ਵੀ ਰਿਕਾਰਡ ਦਰਜ ਕਰ ਸਕਦੇ ਹੋ। ਹੱਬ ਉਪਲਬਧ ਹੋਣ ਉੱਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਕਾਪੀ ਕਰੋ।',
  ],
  'The hub must acknowledge your changes before they count as copied.': [
    'बदलाव कॉपी माने जाने से पहले हब की पुष्टि ज़रूरी है।',
    'ਬਦਲਾਅ ਕਾਪੀ ਮੰਨੇ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਹੱਬ ਦੀ ਪੁਸ਼ਟੀ ਲਾਜ਼ਮੀ ਹੈ।',
  ],
  'Copying…': ['कॉपी हो रही है…', 'ਕਾਪੀ ਹੋ ਰਹੀ ਹੈ…'],
  'Copy changes to hub': ['बदलाव हब पर कॉपी करें', 'ਬਦਲਾਅ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕਰੋ'],
  'The copy could not finish:': ['कॉपी पूरी नहीं हो सकी:', 'ਕਾਪੀ ਪੂਰੀ ਨਹੀਂ ਹੋ ਸਕੀ:'],
  'Your saved local records are kept. Check the connection and try again.': [
    'आपके सहेजे गए स्थानीय रिकॉर्ड सुरक्षित हैं। कनेक्शन जाँचें और फिर कोशिश करें।',
    'ਤੁਹਾਡੇ ਸੰਭਾਲੇ ਸਥਾਨਕ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹਨ। ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ ਅਤੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  ],
  'Keep this page open until offline support finishes installing. Existing encrypted records stay in this browser.':
    [
      'ऑफ़लाइन सुविधा स्थापित होने तक यह पेज खुला रखें। मौजूदा एन्क्रिप्ट किए गए रिकॉर्ड इस ब्राउज़र में रहते हैं।',
      'ਆਫ਼ਲਾਈਨ ਸਹੂਲਤ ਸਥਾਪਤ ਹੋਣ ਤੱਕ ਇਹ ਪੰਨਾ ਖੁੱਲ੍ਹਾ ਰੱਖੋ। ਮੌਜੂਦਾ ਇਨਕ੍ਰਿਪਟ ਕੀਤੇ ਰਿਕਾਰਡ ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਰਹਿੰਦੇ ਹਨ।',
    ],
  'Three simple steps': ['तीन आसान चरण', 'ਤਿੰਨ ਸੌਖੇ ਕਦਮ'],
  'Fill in the details': ['विवरण भरें', 'ਵੇਰਵਾ ਭਰੋ'],
  'Save on this device': ['इस डिवाइस पर सहेजें', 'ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੋ'],
  'Look for the saved confirmation. You can copy saved changes to the village hub whenever a connection is available.':
    [
      'सहेजने की पुष्टि देखें। कनेक्शन उपलब्ध होने पर आप सहेजे गए बदलाव गाँव के हब पर कॉपी कर सकते हैं।',
      'ਸੰਭਾਲਣ ਦੀ ਪੁਸ਼ਟੀ ਵੇਖੋ। ਕਨੈਕਸ਼ਨ ਉਪਲਬਧ ਹੋਣ ਉੱਤੇ ਤੁਸੀਂ ਸੰਭਾਲੇ ਬਦਲਾਅ ਪਿੰਡ ਦੇ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕਰ ਸਕਦੇ ਹੋ।',
    ],
  'More tools and settings': ['अन्य साधन और सेटिंग', 'ਹੋਰ ਸਾਧਨ ਅਤੇ ਸੈਟਿੰਗਾਂ'],
  'More tools': ['अन्य साधन', 'ਹੋਰ ਸਾਧਨ'],
  'Saving and sync details': ['सहेजने और सिंक का विवरण', 'ਸੰਭਾਲਣ ਅਤੇ ਸਿੰਕ ਦਾ ਵੇਰਵਾ'],
  'Review different entries': ['अलग प्रविष्टियाँ जाँचें', 'ਵੱਖਰੀਆਂ ਐਂਟਰੀਆਂ ਦੀ ਜਾਂਚ ਕਰੋ'],
  'PIN, backup and recovery': ['PIN, बैकअप और बहाली', 'PIN, ਬੈਕਅੱਪ ਅਤੇ ਬਹਾਲੀ'],
  'Hub database': ['हब डेटाबेस', 'ਹੱਬ ਡਾਟਾਬੇਸ'],
  'Use the offline record database': ['ऑफ़लाइन रिकॉर्ड डेटाबेस इस्तेमाल करें', 'ਆਫ਼ਲਾਈਨ ਰਿਕਾਰਡ ਡਾਟਾਬੇਸ ਵਰਤੋ'],
  'Find the encrypted record stored on this device.': [
    'इस डिवाइस पर सुरक्षित एन्क्रिप्टेड रिकॉर्ड खोजें।',
    'ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੁਰੱਖਿਅਤ ਇਨਕ੍ਰਿਪਟ ਕੀਤਾ ਰਿਕਾਰਡ ਲੱਭੋ।',
  ],
  'Create or edit the details, then choose Save on device.': [
    'विवरण बनाएँ या बदलें, फिर डिवाइस पर सहेजें चुनें।',
    'ਵੇਰਵਾ ਬਣਾਓ ਜਾਂ ਸੋਧੋ, ਫਿਰ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੋ ਚੁਣੋ।',
  ],
  'Synchronize when a village hub connection is available.': [
    'गाँव के हब का कनेक्शन मिलने पर सिंक करें।',
    'ਪਿੰਡ ਦੇ ਹੱਬ ਦਾ ਕਨੈਕਸ਼ਨ ਮਿਲਣ ਉੱਤੇ ਸਿੰਕ ਕਰੋ।',
  ],
  'Records work offline. Device management, enrollment, audit, and quarantine need a connection.': [
    'रिकॉर्ड ऑफ़लाइन काम करते हैं। डिवाइस प्रबंधन, पंजीकरण, ऑडिट और अलग रखे बदलावों के लिए कनेक्शन चाहिए।',
    'ਰਿਕਾਰਡ ਆਫ਼ਲਾਈਨ ਕੰਮ ਕਰਦੇ ਹਨ। ਡਿਵਾਈਸ ਪ੍ਰਬੰਧਨ, ਰਜਿਸਟ੍ਰੇਸ਼ਨ, ਆਡਿਟ ਅਤੇ ਵੱਖ ਰੱਖੀਆਂ ਸੋਧਾਂ ਲਈ ਕਨੈਕਸ਼ਨ ਚਾਹੀਦਾ ਹੈ।',
  ],
  'Try the resilience lab': ['लचीलेपन की प्रयोगशाला आज़माएँ', 'ਲਚਕੀਲੇਪਣ ਦੀ ਲੈਬ ਅਜ਼ਮਾਓ'],
  'Check this child’s record': ['इस बच्चे का रिकॉर्ड जाँचें', 'ਇਸ ਬੱਚੇ ਦਾ ਰਿਕਾਰਡ ਜਾਂਚੋ'],
  'Check the name and details to make sure this is the right child.': [
    'सही बच्चे की पहचान के लिए नाम और विवरण जाँचें।',
    'ਸਹੀ ਬੱਚੇ ਦੀ ਪਛਾਣ ਲਈ ਨਾਮ ਅਤੇ ਵੇਰਵਾ ਜਾਂਚੋ।',
  ],
  'Open the section you need, or choose Edit to update the details.': [
    'ज़रूरी भाग खोलें या विवरण बदलने के लिए संपादित करें चुनें।',
    'ਲੋੜੀਂਦਾ ਭਾਗ ਖੋਲ੍ਹੋ ਜਾਂ ਵੇਰਵਾ ਬਦਲਣ ਲਈ ਸੋਧੋ ਚੁਣੋ।',
  ],
  'Save your changes and look for the saved confirmation.': [
    'अपने बदलाव सहेजें और सहेजने की पुष्टि देखें।',
    'ਆਪਣੇ ਬਦਲਾਅ ਸੰਭਾਲੋ ਅਤੇ ਸੰਭਾਲਣ ਦੀ ਪੁਸ਼ਟੀ ਵੇਖੋ।',
  ],
  'If two entries disagree, review the difference before relying on either account.': [
    'यदि दो प्रविष्टियाँ मेल नहीं खातीं, तो किसी पर भरोसा करने से पहले अंतर जाँचें।',
    'ਜੇ ਦੋ ਐਂਟਰੀਆਂ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀਆਂ, ਤਾਂ ਕਿਸੇ ਉੱਤੇ ਭਰੋਸਾ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਫ਼ਰਕ ਜਾਂਚੋ।',
  ],
  'Find or add a child': ['बच्चा खोजें या जोड़ें', 'ਬੱਚਾ ਲੱਭੋ ਜਾਂ ਜੋੜੋ'],
  'Search by name, ID or village. Check the list to avoid adding the same child twice.': [
    'नाम, ID या गाँव से खोजें। एक ही बच्चे को दोबारा जोड़ने से बचने के लिए सूची जाँचें।',
    'ਨਾਮ, ID ਜਾਂ ਪਿੰਡ ਨਾਲ ਲੱਭੋ। ਇੱਕੋ ਬੱਚੇ ਨੂੰ ਮੁੜ ਜੋੜਨ ਤੋਂ ਬਚਣ ਲਈ ਸੂਚੀ ਜਾਂਚੋ।',
  ],
  'Open a child’s record, or choose New child to enter a new record.': [
    'बच्चे का रिकॉर्ड खोलें या नया रिकॉर्ड दर्ज करने के लिए नया बच्चा चुनें।',
    'ਬੱਚੇ ਦਾ ਰਿਕਾਰਡ ਖੋਲ੍ਹੋ ਜਾਂ ਨਵਾਂ ਰਿਕਾਰਡ ਦਰਜ ਕਰਨ ਲਈ ਨਵਾਂ ਬੱਚਾ ਚੁਣੋ।',
  ],
  'For a new child, enter the details, confirm guardian consent and save on this device.': [
    'नए बच्चे का विवरण दर्ज करें, अभिभावक की सहमति की पुष्टि करें और इस डिवाइस पर सहेजें।',
    'ਨਵੇਂ ਬੱਚੇ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ, ਸਰਪ੍ਰਸਤ ਦੀ ਸਹਿਮਤੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੋ।',
  ],
  'Enter assessment marks': ['मूल्यांकन के अंक दर्ज करें', 'ਮੁਲਾਂਕਣ ਦੇ ਅੰਕ ਦਰਜ ਕਰੋ'],
  'Choose Assessments, then enter the title, attempt and class.': [
    'मूल्यांकन चुनें, फिर शीर्षक, प्रयास और कक्षा दर्ज करें।',
    'ਮੁਲਾਂਕਣ ਚੁਣੋ, ਫਿਰ ਸਿਰਲੇਖ, ਕੋਸ਼ਿਸ਼ ਅਤੇ ਜਮਾਤ ਦਰਜ ਕਰੋ।',
  ],
  'Enter each child’s score from 0 to 100. A score of 0 is a valid mark.': [
    'हर बच्चे के अंक 0 से 100 के बीच दर्ज करें। 0 भी मान्य अंक है।',
    'ਹਰ ਬੱਚੇ ਦੇ ਅੰਕ 0 ਤੋਂ 100 ਵਿਚਕਾਰ ਦਰਜ ਕਰੋ। 0 ਵੀ ਮੰਨਣਯੋਗ ਅੰਕ ਹੈ।',
  ],
  'Check the row’s save status. Unfinished or invalid scores stay as drafts until corrected.': [
    'पंक्ति में सहेजने की स्थिति जाँचें। अधूरे या अमान्य अंक सुधारे जाने तक ड्राफ़्ट रहते हैं।',
    'ਕਤਾਰ ਵਿੱਚ ਸੰਭਾਲਣ ਦੀ ਸਥਿਤੀ ਜਾਂਚੋ। ਅਧੂਰੇ ਜਾਂ ਗਲਤ ਅੰਕ ਠੀਕ ਕੀਤੇ ਜਾਣ ਤੱਕ ਡਰਾਫ਼ਟ ਰਹਿੰਦੇ ਹਨ।',
  ],
  'Drafts are kept on this device. Only successfully recorded scores can copy to the hub.': [
    'ड्राफ़्ट इस डिवाइस पर रहते हैं। केवल सफलतापूर्वक दर्ज अंक ही हब पर कॉपी हो सकते हैं।',
    'ਡਰਾਫ਼ਟ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਰਹਿੰਦੇ ਹਨ। ਸਿਰਫ਼ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਅੰਕ ਹੀ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਹੋ ਸਕਦੇ ਹਨ।',
  ],
  'Mark class attendance': ['कक्षा की हाज़िरी लगाएँ', 'ਜਮਾਤ ਦੀ ਹਾਜ਼ਰੀ ਲਗਾਓ'],
  'Choose Attendance, then check the date and class.': [
    'हाज़िरी चुनें, फिर तारीख और कक्षा जाँचें।',
    'ਹਾਜ਼ਰੀ ਚੁਣੋ, ਫਿਰ ਤਾਰੀਖ ਅਤੇ ਜਮਾਤ ਜਾਂਚੋ।',
  ],
  'Choose Present, Absent, Late or Excused for each child.': [
    'हर बच्चे के लिए उपस्थित, अनुपस्थित, देर से या अनुमति प्राप्त चुनें।',
    'ਹਰ ਬੱਚੇ ਲਈ ਹਾਜ਼ਰ, ਗੈਰਹਾਜ਼ਰ, ਦੇਰ ਨਾਲ ਜਾਂ ਮਨਜ਼ੂਰ ਛੁੱਟੀ ਚੁਣੋ।',
  ],
  'Look for the saved status. You can safely continue without a connection.': [
    'सहेजने की स्थिति देखें। आप बिना कनेक्शन के भी काम जारी रख सकते हैं।',
    'ਸੰਭਾਲਣ ਦੀ ਸਥਿਤੀ ਵੇਖੋ। ਤੁਸੀਂ ਬਿਨਾਂ ਕਨੈਕਸ਼ਨ ਦੇ ਵੀ ਕੰਮ ਜਾਰੀ ਰੱਖ ਸਕਦੇ ਹੋ।',
  ],
  'Bulk marking fills unmarked children. Existing marks are kept.': [
    'सामूहिक हाज़िरी केवल बिना हाज़िरी वाले बच्चों को भरती है। मौजूदा हाज़िरी सुरक्षित रहती है।',
    'ਸਮੂਹਿਕ ਹਾਜ਼ਰੀ ਸਿਰਫ਼ ਬਿਨਾਂ ਹਾਜ਼ਰੀ ਵਾਲੇ ਬੱਚਿਆਂ ਨੂੰ ਭਰਦੀ ਹੈ। ਮੌਜੂਦਾ ਹਾਜ਼ਰੀ ਸੰਭਾਲੀ ਰਹਿੰਦੀ ਹੈ।',
  ],
  'Record a health event': ['स्वास्थ्य घटना दर्ज करें', 'ਸਿਹਤ ਘਟਨਾ ਦਰਜ ਕਰੋ'],
  'Find and select the child. Check their details in the selected-child panel.': [
    'बच्चे को खोजकर चुनें। चयनित बच्चे के पैनल में उसका विवरण जाँचें।',
    'ਬੱਚੇ ਨੂੰ ਲੱਭ ਕੇ ਚੁਣੋ। ਚੁਣੇ ਬੱਚੇ ਦੇ ਪੈਨਲ ਵਿੱਚ ਉਸ ਦਾ ਵੇਰਵਾ ਜਾਂਚੋ।',
  ],
  'Choose the record type and date, then enter what was observed or administered.': [
    'रिकॉर्ड का प्रकार और तारीख चुनें, फिर देखी गई बात या दिए गए उपचार का विवरण दर्ज करें।',
    'ਰਿਕਾਰਡ ਦੀ ਕਿਸਮ ਅਤੇ ਤਾਰੀਖ ਚੁਣੋ, ਫਿਰ ਜੋ ਵੇਖਿਆ ਜਾਂ ਦਿੱਤਾ ਗਿਆ ਉਹ ਦਰਜ ਕਰੋ।',
  ],
  'Choose Save health record and wait for the saved confirmation.': [
    'स्वास्थ्य रिकॉर्ड सहेजें चुनें और पुष्टि की प्रतीक्षा करें।',
    'ਸਿਹਤ ਰਿਕਾਰਡ ਸੰਭਾਲੋ ਚੁਣੋ ਅਤੇ ਪੁਸ਼ਟੀ ਦੀ ਉਡੀਕ ਕਰੋ।',
  ],
  'Keep each observation factual. The app records events; it does not provide a diagnosis.': [
    'हर अवलोकन तथ्य पर आधारित रखें। ऐप घटनाएँ दर्ज करता है; निदान नहीं देता।',
    'ਹਰ ਨਿਰੀਖਣ ਤੱਥਾਂ ਉੱਤੇ ਆਧਾਰਿਤ ਰੱਖੋ। ਐਪ ਘਟਨਾਵਾਂ ਦਰਜ ਕਰਦੀ ਹੈ; ਰੋਗ ਦੀ ਪਛਾਣ ਨਹੀਂ ਕਰਦੀ।',
  ],
  'Learn and practise': ['सीखें और अभ्यास करें', 'ਸਿੱਖੋ ਅਤੇ ਅਭਿਆਸ ਕਰੋ'],
  'Choose a lesson or activity from the library.': [
    'पुस्तकालय से पाठ या गतिविधि चुनें।',
    'ਲਾਇਬ੍ਰੇਰੀ ਵਿੱਚੋਂ ਪਾਠ ਜਾਂ ਗਤੀਵਿਧੀ ਚੁਣੋ।',
  ],
  'Read the instructions and try the questions.': [
    'निर्देश पढ़ें और प्रश्न हल करें।',
    'ਹਦਾਇਤਾਂ ਪੜ੍ਹੋ ਅਤੇ ਸਵਾਲ ਹੱਲ ਕਰੋ।',
  ],
  'Check the result and continue at your own pace.': [
    'परिणाम देखें और अपनी गति से आगे बढ़ें।',
    'ਨਤੀਜਾ ਵੇਖੋ ਅਤੇ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਅੱਗੇ ਵਧੋ।',
  ],
  'Downloaded activities work offline. External resource links need a connection.': [
    'डाउनलोड की गई गतिविधियाँ ऑफ़लाइन चलती हैं। बाहरी संसाधनों के लिंक के लिए कनेक्शन चाहिए।',
    'ਡਾਊਨਲੋਡ ਕੀਤੀਆਂ ਗਤੀਵਿਧੀਆਂ ਆਫ਼ਲਾਈਨ ਚੱਲਦੀਆਂ ਹਨ। ਬਾਹਰੀ ਸਰੋਤਾਂ ਦੇ ਲਿੰਕਾਂ ਲਈ ਕਨੈਕਸ਼ਨ ਚਾਹੀਦਾ ਹੈ।',
  ],
  'Copy saved changes to the village hub': [
    'सहेजे गए बदलाव गाँव के हब पर कॉपी करें',
    'ਸੰਭਾਲੇ ਬਦਲਾਅ ਪਿੰਡ ਦੇ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕਰੋ',
  ],
  'Check how many changes are saved on this device and waiting to copy.': [
    'देखें कि इस डिवाइस पर कितने बदलाव सहेजे गए हैं और कॉपी होने की प्रतीक्षा में हैं।',
    'ਵੇਖੋ ਕਿ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਕਿੰਨੇ ਬਦਲਾਅ ਸੰਭਾਲੇ ਹਨ ਅਤੇ ਕਾਪੀ ਹੋਣ ਦੀ ਉਡੀਕ ਵਿੱਚ ਹਨ।',
  ],
  'When the hub is reachable, choose Sync with village hub.': [
    'हब उपलब्ध होने पर गाँव के हब से सिंक करें चुनें।',
    'ਹੱਬ ਉਪਲਬਧ ਹੋਣ ਉੱਤੇ ਪਿੰਡ ਦੇ ਹੱਬ ਨਾਲ ਸਿੰਕ ਕਰੋ ਚੁਣੋ।',
  ],
  'Wait for completion. If it stops, your local records are kept and you can retry.': [
    'पूरा होने की प्रतीक्षा करें। बीच में रुकने पर स्थानीय रिकॉर्ड सुरक्षित रहते हैं और आप फिर कोशिश कर सकते हैं।',
    'ਪੂਰਾ ਹੋਣ ਦੀ ਉਡੀਕ ਕਰੋ। ਵਿਚਕਾਰ ਰੁਕਣ ਉੱਤੇ ਸਥਾਨਕ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੇ ਹਨ ਅਤੇ ਤੁਸੀਂ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰ ਸਕਦੇ ਹੋ।',
  ],
  '“Saved on this device” and “copied to the hub” are separate confirmations.': [
    '“इस डिवाइस पर सहेजे गए” और “हब पर कॉपी किए गए” अलग-अलग पुष्टियाँ हैं।',
    '“ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੇ” ਅਤੇ “ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕੀਤੇ” ਵੱਖ-ਵੱਖ ਪੁਸ਼ਟੀਆਂ ਹਨ।',
  ],
  'Check entries that disagree': ['असहमत प्रविष्टियाँ जाँचें', 'ਮੇਲ ਨਾ ਖਾਂਦੀਆਂ ਐਂਟਰੀਆਂ ਜਾਂਚੋ'],
  'Read both accounts and check who entered them.': [
    'दोनों विवरण पढ़ें और देखें कि उन्हें किसने दर्ज किया।',
    'ਦੋਵੇਂ ਵੇਰਵੇ ਪੜ੍ਹੋ ਅਤੇ ਵੇਖੋ ਕਿ ਉਨ੍ਹਾਂ ਨੂੰ ਕਿਸ ਨੇ ਦਰਜ ਕੀਤਾ।',
  ],
  'Verify the correct information with the responsible person.': [
    'ज़िम्मेदार व्यक्ति से सही जानकारी की पुष्टि करें।',
    'ਜ਼ਿੰਮੇਵਾਰ ਵਿਅਕਤੀ ਤੋਂ ਸਹੀ ਜਾਣਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।',
  ],
  'Keep the verified account, or enter a corrected value and save the decision.': [
    'पुष्टि किए गए विवरण को रखें या सही मान दर्ज करके निर्णय सहेजें।',
    'ਪੁਸ਼ਟੀ ਕੀਤੇ ਵੇਰਵੇ ਨੂੰ ਰੱਖੋ ਜਾਂ ਸਹੀ ਮੁੱਲ ਦਰਜ ਕਰਕੇ ਫ਼ੈਸਲਾ ਸੰਭਾਲੋ।',
  ],
  'Do not guess. Original entries remain in the history after a decision.': [
    'अनुमान न लगाएँ। निर्णय के बाद भी मूल प्रविष्टियाँ इतिहास में रहती हैं।',
    'ਅੰਦਾਜ਼ਾ ਨਾ ਲਗਾਓ। ਫ਼ੈਸਲੇ ਤੋਂ ਬਾਅਦ ਵੀ ਅਸਲ ਐਂਟਰੀਆਂ ਇਤਿਹਾਸ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ।',
  ],
  'Keep your workspace recoverable': [
    'अपने कार्यक्षेत्र की बहाली संभव रखें',
    'ਆਪਣੇ ਵਰਕਸਪੇਸ ਦੀ ਬਹਾਲੀ ਸੰਭਵ ਰੱਖੋ',
  ],
  'Save your recovery code somewhere private and separate from this device.': [
    'अपना बहाली कोड इस डिवाइस से अलग किसी निजी जगह पर रखें।',
    'ਆਪਣਾ ਬਹਾਲੀ ਕੋਡ ਇਸ ਡਿਵਾਈਸ ਤੋਂ ਵੱਖ ਕਿਸੇ ਨਿੱਜੀ ਥਾਂ ਰੱਖੋ।',
  ],
  'Export an encrypted backup to keep records that have not copied to the hub.': [
    'हब पर कॉपी न हुए रिकॉर्ड रखने के लिए एन्क्रिप्ट किया गया बैकअप निर्यात करें।',
    'ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਨਾ ਹੋਏ ਰਿਕਾਰਡ ਰੱਖਣ ਲਈ ਇਨਕ੍ਰਿਪਟ ਕੀਤਾ ਬੈਕਅੱਪ ਨਿਰਯਾਤ ਕਰੋ।',
  ],
  'Keep the backup password private. You need it to restore that file.': [
    'बैकअप का पासवर्ड निजी रखें। फ़ाइल बहाल करने के लिए इसकी ज़रूरत होगी।',
    'ਬੈਕਅੱਪ ਦਾ ਪਾਸਵਰਡ ਨਿੱਜੀ ਰੱਖੋ। ਫ਼ਾਈਲ ਬਹਾਲ ਕਰਨ ਲਈ ਇਸ ਦੀ ਲੋੜ ਪਵੇਗੀ।',
  ],
  'A recovery code restores synchronized records. Unsynchronized records need their encrypted backup.': [
    'बहाली कोड सिंक किए गए रिकॉर्ड बहाल करता है। बिना सिंक वाले रिकॉर्ड के लिए उनका एन्क्रिप्ट किया गया बैकअप चाहिए।',
    'ਬਹਾਲੀ ਕੋਡ ਸਿੰਕ ਕੀਤੇ ਰਿਕਾਰਡ ਬਹਾਲ ਕਰਦਾ ਹੈ। ਬਿਨਾਂ ਸਿੰਕ ਵਾਲੇ ਰਿਕਾਰਡਾਂ ਲਈ ਉਨ੍ਹਾਂ ਦਾ ਇਨਕ੍ਰਿਪਟ ਕੀਤਾ ਬੈਕਅੱਪ ਚਾਹੀਦਾ ਹੈ।',
  ],
  'Work with the hub database': ['हब डेटाबेस में काम करें', 'ਹੱਬ ਡਾਟਾਬੇਸ ਵਿੱਚ ਕੰਮ ਕਰੋ'],
  'Connect to the village hub and find the record you need.': [
    'गाँव के हब से जुड़ें और ज़रूरी रिकॉर्ड खोजें।',
    'ਪਿੰਡ ਦੇ ਹੱਬ ਨਾਲ ਜੁੜੋ ਅਤੇ ਲੋੜੀਂਦਾ ਰਿਕਾਰਡ ਲੱਭੋ।',
  ],
  'Create or edit the details, then choose Save at hub.': [
    'विवरण बनाएँ या बदलें, फिर हब पर सहेजें चुनें।',
    'ਵੇਰਵਾ ਬਣਾਓ ਜਾਂ ਸੋਧੋ, ਫਿਰ ਹੱਬ ਉੱਤੇ ਸੰਭਾਲੋ ਚੁਣੋ।',
  ],
  'Wait for the hub confirmation. Synchronize this device to see the change in the offline list.': [
    'हब की पुष्टि की प्रतीक्षा करें। ऑफ़लाइन सूची में बदलाव देखने के लिए इस डिवाइस को सिंक करें।',
    'ਹੱਬ ਦੀ ਪੁਸ਼ਟੀ ਦੀ ਉਡੀਕ ਕਰੋ। ਆਫ਼ਲਾਈਨ ਸੂਚੀ ਵਿੱਚ ਬਦਲਾਅ ਵੇਖਣ ਲਈ ਇਸ ਡਿਵਾਈਸ ਨੂੰ ਸਿੰਕ ਕਰੋ।',
  ],
  'This page needs a connection. Use Children, Classroom or Health records for offline entry.': [
    'इस पेज के लिए कनेक्शन चाहिए। ऑफ़लाइन प्रविष्टि के लिए बच्चे, कक्षा या स्वास्थ्य रिकॉर्ड इस्तेमाल करें।',
    'ਇਸ ਪੰਨੇ ਲਈ ਕਨੈਕਸ਼ਨ ਚਾਹੀਦਾ ਹੈ। ਆਫ਼ਲਾਈਨ ਐਂਟਰੀ ਲਈ ਬੱਚੇ, ਜਮਾਤ ਜਾਂ ਸਿਹਤ ਰਿਕਾਰਡ ਵਰਤੋ।',
  ],
  'Try the offline demonstration': ['ऑफ़लाइन प्रदर्शन आज़माएँ', 'ਆਫ਼ਲਾਈਨ ਪ੍ਰਦਰਸ਼ਨ ਅਜ਼ਮਾਓ'],
  'Start the guided demonstration using the synthetic lab records.': [
    'कृत्रिम लैब रिकॉर्ड के साथ निर्देशित प्रदर्शन शुरू करें।',
    'ਬਣਾਵਟੀ ਲੈਬ ਰਿਕਾਰਡਾਂ ਨਾਲ ਹਦਾਇਤਾਂ ਵਾਲਾ ਪ੍ਰਦਰਸ਼ਨ ਸ਼ੁਰੂ ਕਰੋ।',
  ],
  'Follow the steps to interrupt connections or make different edits.': [
    'कनेक्शन रोकने या अलग बदलाव करने के लिए चरणों का पालन करें।',
    'ਕਨੈਕਸ਼ਨ ਰੋਕਣ ਜਾਂ ਵੱਖ ਬਦਲਾਅ ਕਰਨ ਲਈ ਕਦਮਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
  ],
  'Reconnect and inspect how the records and differences are preserved.': [
    'फिर जुड़ें और देखें कि रिकॉर्ड और अंतर कैसे सुरक्षित रहते हैं।',
    'ਮੁੜ ਜੁੜੋ ਅਤੇ ਵੇਖੋ ਕਿ ਰਿਕਾਰਡ ਅਤੇ ਫ਼ਰਕ ਕਿਵੇਂ ਸੰਭਾਲੇ ਰਹਿੰਦੇ ਹਨ।',
  ],
  'The lab is a demonstration. Your real workspace is separate from the lab devices.': [
    'लैब एक प्रदर्शन है। आपका वास्तविक कार्यक्षेत्र लैब डिवाइसों से अलग है।',
    'ਲੈਬ ਇੱਕ ਪ੍ਰਦਰਸ਼ਨ ਹੈ। ਤੁਹਾਡਾ ਅਸਲ ਵਰਕਸਪੇਸ ਲੈਬ ਡਿਵਾਈਸਾਂ ਤੋਂ ਵੱਖ ਹੈ।',
  ],
  'Page help': ['पेज की सहायता', 'ਪੰਨੇ ਦੀ ਮਦਦ'],
  'Back to activities': ['गतिविधियों पर वापस जाएँ', 'ਗਤੀਵਿਧੀਆਂ ਉੱਤੇ ਵਾਪਸ ਜਾਓ'],
  'Step-by-step help': ['चरणबद्ध सहायता', 'ਕਦਮ-ਦਰ-ਕਦਮ ਮਦਦ'],
  'How to use this page': ['इस पेज का उपयोग कैसे करें', 'ਇਸ ਪੰਨੇ ਨੂੰ ਕਿਵੇਂ ਵਰਤਣਾ ਹੈ'],
  'Easy mode': ['आसान मोड', 'ਸੌਖਾ ਮੋਡ'],
  'Standard dashboard restored. Your records are unchanged.': [
    'मानक डैशबोर्ड फिर से चालू है। आपके रिकॉर्ड वही हैं।',
    'ਮਿਆਰੀ ਡੈਸ਼ਬੋਰਡ ਮੁੜ ਚਾਲੂ ਹੈ। ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਉਹੀ ਹਨ।',
  ],
  'Easy mode on. Larger controls and step-by-step help.': [
    'आसान मोड चालू है। बड़े नियंत्रण और चरणबद्ध सहायता उपलब्ध हैं।',
    'ਸੌਖਾ ਮੋਡ ਚਾਲੂ ਹੈ। ਵੱਡੇ ਕੰਟਰੋਲ ਅਤੇ ਕਦਮ-ਦਰ-ਕਦਮ ਮਦਦ ਉਪਲਬਧ ਹਨ।',
  ],
  On: ['चालू', 'ਚਾਲੂ'],
  Off: ['बंद', 'ਬੰਦ'],
  'Use larger text, clearer names, and help for everyday tasks. Switch off to return to the standard dashboard. Your records stay the same.':
    [
      'रोज़ के कामों के लिए बड़ा पाठ, सरल नाम और सहायता इस्तेमाल करें। मानक डैशबोर्ड पर लौटने के लिए बंद करें। आपके रिकॉर्ड वही रहते हैं।',
      'ਰੋਜ਼ਾਨਾ ਕੰਮਾਂ ਲਈ ਵੱਡਾ ਪਾਠ, ਸੌਖੇ ਨਾਮ ਅਤੇ ਮਦਦ ਵਰਤੋ। ਮਿਆਰੀ ਡੈਸ਼ਬੋਰਡ ਉੱਤੇ ਮੁੜਨ ਲਈ ਬੰਦ ਕਰੋ। ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਉਹੀ ਰਹਿੰਦੇ ਹਨ।',
    ],
  'Record database and enrollment': ['रिकॉर्ड डेटाबेस और पंजीकरण', 'ਰਿਕਾਰਡ ਡਾਟਾਬੇਸ ਅਤੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ'],
  'New child': ['नया बच्चा', 'ਨਵਾਂ ਬੱਚਾ'],
  'Attendance and assessments': ['हाज़िरी और मूल्यांकन', 'ਹਾਜ਼ਰੀ ਅਤੇ ਮੁਲਾਂਕਣ'],
  'Add health record': ['स्वास्थ्य रिकॉर्ड जोड़ें', 'ਸਿਹਤ ਰਿਕਾਰਡ ਜੋੜੋ'],
  'Sync center': ['सिंक केंद्र', 'ਸਿੰਕ ਕੇਂਦਰ'],
  'Conflict inbox': ['मतभेद की जाँच', 'ਮਤਭੇਦਾਂ ਦੀ ਜਾਂਚ'],
  'Village hub tools': ['गाँव के हब के साधन', 'ਪਿੰਡ ਦੇ ਹੱਬ ਦੇ ਸਾਧਨ'],
  'Attendance & marks': ['हाज़िरी और अंक', 'ਹਾਜ਼ਰੀ ਅਤੇ ਅੰਕ'],
  'Identity needs review': ['पहचान की जाँच ज़रूरी है', 'ਪਛਾਣ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ'],
  'Find a child or activity Ctrl K': ['बच्चा या गतिविधि खोजें Ctrl K', 'ਬੱਚਾ ਜਾਂ ਗਤੀਵਿਧੀ ਲੱਭੋ Ctrl K'],
  'Search or jump to… Ctrl K': ['खोजें या सीधे जाएँ… Ctrl K', 'ਲੱਭੋ ਜਾਂ ਸਿੱਧੇ ਜਾਓ… Ctrl K'],
  'Find a child or activity': ['बच्चा या गतिविधि खोजें', 'ਬੱਚਾ ਜਾਂ ਗਤੀਵਿਧੀ ਲੱਭੋ'],
  'Search or jump to…': ['खोजें या सीधे जाएँ…', 'ਲੱਭੋ ਜਾਂ ਸਿੱਧੇ ਜਾਓ…'],
  'Search records and pages': ['रिकॉर्ड और पेज खोजें', 'ਰਿਕਾਰਡ ਅਤੇ ਪੰਨੇ ਲੱਭੋ'],
  'Search workspace': ['कार्यक्षेत्र में खोजें', 'ਵਰਕਸਪੇਸ ਵਿੱਚ ਲੱਭੋ'],
  'Type a child’s name, village, or activity…': [
    'बच्चे का नाम, गाँव या गतिविधि लिखें…',
    'ਬੱਚੇ ਦਾ ਨਾਮ, ਪਿੰਡ ਜਾਂ ਗਤੀਵਿਧੀ ਲਿਖੋ…',
  ],
  'Search by name, ID, village, or page…': [
    'नाम, ID, गाँव या पेज से खोजें…',
    'ਨਾਮ, ID, ਪਿੰਡ ਜਾਂ ਪੰਨੇ ਨਾਲ ਲੱਭੋ…',
  ],
  'No matching records or pages.': [
    'कोई मिलता-जुलता रिकॉर्ड या पेज नहीं है।',
    'ਕੋਈ ਮੇਲ ਖਾਂਦਾ ਰਿਕਾਰਡ ਜਾਂ ਪੰਨਾ ਨਹੀਂ ਹੈ।',
  ],
  'Search works offline. Choose a result to open it. Close this window to go back.': [
    'खोज ऑफ़लाइन भी चलती है। खोलने के लिए परिणाम चुनें। वापस जाने के लिए यह विंडो बंद करें।',
    'ਖੋਜ ਆਫ਼ਲਾਈਨ ਵੀ ਚੱਲਦੀ ਹੈ। ਖੋਲ੍ਹਣ ਲਈ ਨਤੀਜਾ ਚੁਣੋ। ਵਾਪਸ ਜਾਣ ਲਈ ਇਹ ਵਿੰਡੋ ਬੰਦ ਕਰੋ।',
  ],
  'Search runs on this device. ↑ ↓ to navigate, Enter to open, Esc to close.': [
    'खोज इस डिवाइस पर होती है। ↑ ↓ से चुनें, Enter से खोलें, Esc से बंद करें।',
    'ਖੋਜ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਹੁੰਦੀ ਹੈ। ↑ ↓ ਨਾਲ ਚੁਣੋ, Enter ਨਾਲ ਖੋਲ੍ਹੋ, Esc ਨਾਲ ਬੰਦ ਕਰੋ।',
  ],
  'Close dialog': ['विंडो बंद करें', 'ਵਿੰਡੋ ਬੰਦ ਕਰੋ'],
  'Saving…': ['सहेजा जा रहा है…', 'ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ…'],
  'Not yet': ['अभी तक नहीं', 'ਹਾਲੇ ਨਹੀਂ'],
};
