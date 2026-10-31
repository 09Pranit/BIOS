import { labTranslations } from './lab';
// English source keys map to Hindi and Punjabi. Stored records and signed values are never translated.
export const workspaceTranslations: Record<string, readonly [string, string]> = {
  ...labTranslations,
  'A deletion and an edit happened independently. Both must be reviewed before the record changes.': [
    'एक व्यक्ति ने रिकॉर्ड हटाया और दूसरे ने उसी समय अलग से बदलाव किया। रिकॉर्ड बदलने से पहले दोनों की जाँच ज़रूरी है।',
    'ਇੱਕ ਵਿਅਕਤੀ ਨੇ ਰਿਕਾਰਡ ਹਟਾਇਆ ਅਤੇ ਦੂਜੇ ਨੇ ਉਸੇ ਸਮੇਂ ਵੱਖਰੇ ਤੌਰ ਉੱਤੇ ਤਬਦੀਲੀ ਕੀਤੀ। ਰਿਕਾਰਡ ਬਦਲਣ ਤੋਂ ਪਹਿਲਾਂ ਦੋਵਾਂ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ।',
  ],
  'Two people changed {field} without seeing each other’s work. A clock cannot decide which account is correct.':
    [
      'दो लोगों ने एक-दूसरे का काम देखे बिना {field} बदला। केवल समय देखकर सही जानकारी नहीं चुनी जा सकती।',
      'ਦੋ ਲੋਕਾਂ ਨੇ ਇੱਕ-ਦੂਜੇ ਦਾ ਕੰਮ ਵੇਖੇ ਬਿਨਾਂ {field} ਬਦਲਿਆ। ਕੇਵਲ ਸਮਾਂ ਵੇਖ ਕੇ ਸਹੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਚੁਣੀ ਜਾ ਸਕਦੀ।',
    ],
  'Record deletion': ['रिकॉर्ड हटाना', 'ਰਿਕਾਰਡ ਹਟਾਉਣਾ'],
  'Vaccination status': ['टीकाकरण की स्थिति', 'ਟੀਕਾਕਰਨ ਦੀ ਹਾਲਤ'],
  Allergy: ['एलर्जी', 'ਐਲਰਜੀ'],
  Prescription: ['दवा का पर्चा', 'ਦਵਾਈ ਦਾ ਪਰਚਾ'],
  Gender: ['लिंग', 'ਲਿੰਗ'],
  Phone: ['फोन', 'ਫ਼ੋਨ'],
  'Child’s name': ['बच्चे का नाम', 'ਬੱਚੇ ਦਾ ਨਾਮ'],
  'Date of birth': ['जन्म तिथि', 'ਜਨਮ ਮਿਤੀ'],
  Class: ['कक्षा', 'ਜਮਾਤ'],
  'Guardian’s name': ['अभिभावक का नाम', 'ਸਰਪ੍ਰਸਤ ਦਾ ਨਾਮ'],
  'Parent or caregiver: enter the name of the person responsible for this child.': [
    'माता-पिता या देखभाल करने वाले: बच्चे की ज़िम्मेदारी संभालने वाले व्यक्ति का नाम भरें।',
    'ਮਾਪੇ ਜਾਂ ਦੇਖਭਾਲ ਕਰਨ ਵਾਲੇ: ਬੱਚੇ ਦੀ ਜ਼ਿੰਮੇਵਾਰੀ ਸੰਭਾਲਣ ਵਾਲੇ ਵਿਅਕਤੀ ਦਾ ਨਾਮ ਭਰੋ।',
  ],
  Village: ['गाँव', 'ਪਿੰਡ'],
  'Guardian consent obtained for a shared health and school record. Use synthetic details in this demo.': [
    'स्वास्थ्य और स्कूल का साझा रिकॉर्ड रखने के लिए अभिभावक की सहमति मिली है। इस डेमो में काल्पनिक जानकारी भरें।',
    'ਸਿਹਤ ਅਤੇ ਸਕੂਲ ਦਾ ਸਾਂਝਾ ਰਿਕਾਰਡ ਰੱਖਣ ਲਈ ਸਰਪ੍ਰਸਤ ਦੀ ਸਹਿਮਤੀ ਮਿਲੀ ਹੈ। ਇਸ ਡੈਮੋ ਵਿੱਚ ਕਾਲਪਨਿਕ ਜਾਣਕਾਰੀ ਭਰੋ।',
  ],
  'Before checking this box, confirm that the parent or caregiver agreed to keep and share the child’s school and health records in this workspace. This demonstration uses made-up details.':
    [
      'यह विकल्प चुनने से पहले पुष्टि करें कि माता-पिता या देखभाल करने वाले ने यहाँ बच्चे के स्कूल और स्वास्थ्य रिकॉर्ड रखने और साझा करने की सहमति दी है। इस डेमो में काल्पनिक जानकारी का उपयोग होता है।',
      'ਇਹ ਚੋਣ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਪੱਕਾ ਕਰੋ ਕਿ ਮਾਪਿਆਂ ਜਾਂ ਦੇਖਭਾਲ ਕਰਨ ਵਾਲੇ ਨੇ ਇੱਥੇ ਬੱਚੇ ਦੇ ਸਕੂਲ ਅਤੇ ਸਿਹਤ ਰਿਕਾਰਡ ਰੱਖਣ ਅਤੇ ਸਾਂਝੇ ਕਰਨ ਦੀ ਸਹਿਮਤੀ ਦਿੱਤੀ ਹੈ। ਇਸ ਡੈਮੋ ਵਿੱਚ ਕਾਲਪਨਿਕ ਜਾਣਕਾਰੀ ਵਰਤੀ ਜਾਂਦੀ ਹੈ।',
    ],
  'Save and add another': ['सहेजें और अगला जोड़ें', 'ਸੰਭਾਲੋ ਅਤੇ ਅਗਲਾ ਜੋੜੋ'],
  Cancel: ['रद्द करें', 'ਰੱਦ ਕਰੋ'],
  'Ctrl+Enter to save. Required fields are marked *. Records are encrypted before confirmation.': [
    'सहेजने के लिए Ctrl+Enter दबाएँ। ज़रूरी खानों पर * है। पुष्टि से पहले रिकॉर्ड एन्क्रिप्ट होते हैं।',
    'ਸੰਭਾਲਣ ਲਈ Ctrl+Enter ਦਬਾਓ। ਲਾਜ਼ਮੀ ਖਾਨਿਆਂ ਉੱਤੇ * ਹੈ। ਪੁਸ਼ਟੀ ਤੋਂ ਪਹਿਲਾਂ ਰਿਕਾਰਡ ਇਨਕ੍ਰਿਪਟ ਹੁੰਦੇ ਹਨ।',
  ],
  'Edit child': ['बच्चे की जानकारी बदलें', 'ਬੱਚੇ ਦੀ ਜਾਣਕਾਰੀ ਬਦਲੋ'],
  'New child': ['नया बच्चा', 'ਨਵਾਂ ਬੱਚਾ'],
  'Save changes': ['बदलाव सहेजें', 'ਤਬਦੀਲੀਆਂ ਸੰਭਾਲੋ'],
  'Save child': ['बच्चे का रिकॉर्ड सहेजें', 'ਬੱਚੇ ਦਾ ਰਿਕਾਰਡ ਸੰਭਾਲੋ'],
  'Enter a child name with at least two non-space characters.': [
    'बच्चे के नाम में खाली जगहों के अलावा कम से कम दो अक्षर भरें।',
    'ਬੱਚੇ ਦੇ ਨਾਮ ਵਿੱਚ ਖਾਲੀ ਥਾਂ ਤੋਂ ਇਲਾਵਾ ਘੱਟੋ-ਘੱਟ ਦੋ ਅੱਖਰ ਭਰੋ।',
  ],
  'Child record saved on this device · encrypted': [
    'बच्चे का रिकॉर्ड इस डिवाइस पर एन्क्रिप्ट करके सहेजा गया',
    'ਬੱਚੇ ਦਾ ਰਿਕਾਰਡ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਇਨਕ੍ਰਿਪਟ ਕਰਕੇ ਸੰਭਾਲਿਆ ਗਿਆ',
  ],
  'This record hasn’t arrived yet': ['यह रिकॉर्ड अभी नहीं आया है', 'ਇਹ ਰਿਕਾਰਡ ਹਾਲੇ ਨਹੀਂ ਆਇਆ'],
  'Sync with your hub or check the child’s internal ID.': [
    'अपने हब से सिंक करें या बच्चे की आंतरिक आईडी जाँचें।',
    'ਆਪਣੇ ਹੱਬ ਨਾਲ ਸਿੰਕ ਕਰੋ ਜਾਂ ਬੱਚੇ ਦੀ ਅੰਦਰੂਨੀ ਆਈਡੀ ਜਾਂਚੋ।',
  ],
  '← All children': ['← सभी बच्चे', '← ਸਾਰੇ ਬੱਚੇ'],
  '· SHARED WITH CONSENT': ['· सहमति से साझा', '· ਸਹਿਮਤੀ ਨਾਲ ਸਾਂਝਾ'],
  '· Born': ['· जन्म', '· ਜਨਮ'],
  'Identity needs review': ['पहचान की जाँच ज़रूरी है', 'ਪਛਾਣ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ'],
  'Needs review': ['जाँच ज़रूरी है', 'ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ'],
  'Print card': ['कार्ड प्रिंट करें', 'ਕਾਰਡ ਪ੍ਰਿੰਟ ਕਰੋ'],
  'Correct details': ['जानकारी सुधारें', 'ਜਾਣਕਾਰੀ ਠੀਕ ਕਰੋ'],
  'This record has competing accounts.': [
    'इस रिकॉर्ड में अलग-अलग जानकारियाँ हैं।',
    'ਇਸ ਰਿਕਾਰਡ ਵਿੱਚ ਵੱਖ-ਵੱਖ ਜਾਣਕਾਰੀਆਂ ਹਨ।',
  ],
  'Review every version before making a decision.': [
    'निर्णय लेने से पहले हर संस्करण जाँचें।',
    'ਫੈਸਲਾ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਹਰ ਰੂਪ ਜਾਂਚੋ।',
  ],
  'Child details': ['बच्चे की जानकारी', 'ਬੱਚੇ ਦੀ ਜਾਣਕਾਰੀ'],
  Guardian: ['अभिभावक', 'ਸਰਪ੍ਰਸਤ'],
  School: ['स्कूल', 'ਸਕੂਲ'],
  'Shared-record consent': ['साझा रिकॉर्ड की सहमति', 'ਸਾਂਝੇ ਰਿਕਾਰਡ ਦੀ ਸਹਿਮਤੀ'],
  Tags: ['टैग', 'ਟੈਗ'],
  Recorded: ['दर्ज है', 'ਦਰਜ ਹੈ'],
  'Not recorded': ['दर्ज नहीं है', 'ਦਰਜ ਨਹੀਂ ਹੈ'],
  'Not granted': ['अनुमति नहीं मिली', 'ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ'],
  None: ['कोई नहीं', 'ਕੋਈ ਨਹੀਂ'],
  'Mark record deleted (preserves history)': [
    'रिकॉर्ड हटाया हुआ चिह्नित करें (इतिहास बना रहेगा)',
    'ਰਿਕਾਰਡ ਨੂੰ ਹਟਾਇਆ ਹੋਇਆ ਦਰਸਾਓ (ਇਤਿਹਾਸ ਰਹੇਗਾ)',
  ],
  'Restore record': ['रिकॉर्ड वापस लाएँ', 'ਰਿਕਾਰਡ ਵਾਪਸ ਲਿਆਓ'],
  'Health history': ['स्वास्थ्य का इतिहास', 'ਸਿਹਤ ਦਾ ਇਤਿਹਾਸ'],
  'Health visit ·': ['स्वास्थ्य मुलाकात ·', 'ਸਿਹਤ ਮੁਲਾਕਾਤ ·'],
  'Growth measurement ·': ['वृद्धि माप ·', 'ਵਾਧੇ ਦਾ ਮਾਪ ·'],
  'kg ·': ['किग्रा ·', 'ਕਿਲੋ ·'],
  cm: ['सेमी', 'ਸੈਂਮੀ'],
  'Raw measurement · no diagnostic classification': [
    'केवल माप · कोई निदान श्रेणी नहीं',
    'ਕੇਵਲ ਮਾਪ · ਕੋਈ ਨਿਦਾਨ ਵਰਗੀਕਰਨ ਨਹੀਂ',
  ],
  Batch: ['बैच', 'ਬੈਚ'],
  'Room for a new chapter': ['नया रिकॉर्ड जोड़ें', 'ਨਵਾਂ ਰਿਕਾਰਡ ਜੋੜੋ'],
  'Add a health visit or record classroom activity.': [
    'स्वास्थ्य मुलाकात या कक्षा की गतिविधि दर्ज करें।',
    'ਸਿਹਤ ਮੁਲਾਕਾਤ ਜਾਂ ਜਮਾਤ ਦੀ ਗਤੀਵਿਧੀ ਦਰਜ ਕਰੋ।',
  ],
  'Correction & operation history': ['सुधार और बदलावों का इतिहास', 'ਸੁਧਾਰ ਅਤੇ ਤਬਦੀਲੀਆਂ ਦਾ ਇਤਿਹਾਸ'],
  'Original versions are retained': ['मूल संस्करण सुरक्षित हैं', 'ਅਸਲ ਰੂਪ ਸੁਰੱਖਿਅਤ ਹਨ'],
  'Workspace / Reviews': ['कार्यक्षेत्र / जाँच', 'ਕਾਰਜ-ਖੇਤਰ / ਜਾਂਚ'],
  'Check differences': ['अंतर जाँचें', 'ਫ਼ਰਕ ਜਾਂਚੋ'],
  'Conflict inbox': ['विरोधी बदलावों की सूची', 'ਵਿਰੋਧੀ ਤਬਦੀਲੀਆਂ ਦੀ ਸੂਚੀ'],
  'Two people entered different information. Check both entries before deciding which is correct. The originals are kept.':
    [
      'दो लोगों ने अलग जानकारी भरी है। सही जानकारी चुनने से पहले दोनों प्रविष्टियाँ जाँचें। मूल प्रविष्टियाँ सुरक्षित हैं।',
      'ਦੋ ਲੋਕਾਂ ਨੇ ਵੱਖਰੀ ਜਾਣਕਾਰੀ ਭਰੀ ਹੈ। ਸਹੀ ਜਾਣਕਾਰੀ ਚੁਣਨ ਤੋਂ ਪਹਿਲਾਂ ਦੋਵੇਂ ਐਂਟਰੀਆਂ ਜਾਂਚੋ। ਅਸਲ ਐਂਟਰੀਆਂ ਸੁਰੱਖਿਅਤ ਹਨ।',
    ],
  'Different accounts deserve a careful decision. Every original stays in the ledger.': [
    'अलग जानकारियों पर सोच-समझकर निर्णय लें। हर मूल प्रविष्टि इतिहास में रहती है।',
    'ਵੱਖਰੀਆਂ ਜਾਣਕਾਰੀਆਂ ਬਾਰੇ ਧਿਆਨ ਨਾਲ ਫੈਸਲਾ ਕਰੋ। ਹਰ ਅਸਲ ਐਂਟਰੀ ਇਤਿਹਾਸ ਵਿੱਚ ਰਹਿੰਦੀ ਹੈ।',
  ],
  'open differences': ['अंतर जाँचने बाकी हैं', 'ਫ਼ਰਕ ਜਾਂਚਣੇ ਬਾਕੀ ਹਨ'],
  'No differences to check': ['जाँचने के लिए कोई अंतर नहीं', 'ਜਾਂਚਣ ਲਈ ਕੋਈ ਫ਼ਰਕ ਨਹੀਂ'],
  'No unresolved conflicts': ['कोई अनसुलझा विरोधी बदलाव नहीं', 'ਕੋਈ ਅਣਸੁਲਝੀ ਵਿਰੋਧੀ ਤਬਦੀਲੀ ਨਹੀਂ'],
  'When entries disagree, both versions will appear here so someone can check them. Nothing needs a decision right now.':
    [
      'जब प्रविष्टियाँ अलग होंगी, दोनों यहाँ जाँच के लिए दिखेंगी। अभी किसी निर्णय की ज़रूरत नहीं है।',
      'ਜਦੋਂ ਐਂਟਰੀਆਂ ਵੱਖਰੀਆਂ ਹੋਣਗੀਆਂ, ਦੋਵੇਂ ਇੱਥੇ ਜਾਂਚ ਲਈ ਦਿਖਣਗੀਆਂ। ਇਸ ਵੇਲੇ ਕਿਸੇ ਫੈਸਲੇ ਦੀ ਲੋੜ ਨਹੀਂ।',
    ],
  'When people make incompatible changes independently, both accounts will appear here. Try a real concurrent edit in the resilience lab.':
    [
      'जब लोग अलग-अलग विरोधी बदलाव करते हैं, दोनों यहाँ दिखते हैं। परीक्षण प्रयोगशाला में एक साथ बदलाव करके देखें।',
      'ਜਦੋਂ ਲੋਕ ਵੱਖ-ਵੱਖ ਵਿਰੋਧੀ ਤਬਦੀਲੀਆਂ ਕਰਦੇ ਹਨ, ਦੋਵੇਂ ਇੱਥੇ ਦਿਖਦੀਆਂ ਹਨ। ਪਰਖ ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਵਿੱਚ ਇੱਕੋ ਸਮੇਂ ਤਬਦੀਲੀ ਕਰਕੇ ਵੇਖੋ।',
    ],
  'Explore the lab': ['प्रयोगशाला देखें', 'ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਵੇਖੋ'],
  'Human review required': ['व्यक्ति द्वारा जाँच ज़रूरी', 'ਵਿਅਕਤੀ ਵੱਲੋਂ ਜਾਂਚ ਲੋੜੀਂਦੀ'],
  Device: ['डिवाइस', 'ਡਿਵਾਈਸ'],
  HLC: ['HLC', 'HLC'],
  'causal parents:': ['संबंधित पिछली प्रविष्टियाँ:', 'ਸੰਬੰਧਿਤ ਪਿਛਲੀਆਂ ਐਂਟਰੀਆਂ:'],
  'Keep this account': ['यह जानकारी चुनें', 'ਇਹ ਜਾਣਕਾਰੀ ਚੁਣੋ'],
  'Or enter a corrected value': ['या सुधारी हुई जानकारी भरें', 'ਜਾਂ ਸੁਧਾਰੀ ਹੋਈ ਜਾਣਕਾਰੀ ਭਰੋ'],
  'Corrected {field}': ['सुधारा गया {field}', 'ਸੁਧਾਰਿਆ ਹੋਇਆ {field}'],
  'Enter a corrected value': ['सुधारी हुई जानकारी भरें', 'ਸੁਧਾਰੀ ਹੋਈ ਜਾਣਕਾਰੀ ਭਰੋ'],
  'Save reviewed value': ['जाँची गई जानकारी सहेजें', 'ਜਾਂਚੀ ਜਾਣਕਾਰੀ ਸੰਭਾਲੋ'],
  'Your decision is saved as a new entry. Both original entries are kept. If someone makes a different decision, it will come back for review.':
    [
      'आपका निर्णय नई प्रविष्टि के रूप में सहेजा जाता है। दोनों मूल प्रविष्टियाँ सुरक्षित रहती हैं। किसी के अलग निर्णय लेने पर यह फिर जाँच के लिए आएगा।',
      'ਤੁਹਾਡਾ ਫੈਸਲਾ ਨਵੀਂ ਐਂਟਰੀ ਵਜੋਂ ਸੰਭਾਲਿਆ ਜਾਂਦਾ ਹੈ। ਦੋਵੇਂ ਅਸਲ ਐਂਟਰੀਆਂ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੀਆਂ ਹਨ। ਕਿਸੇ ਦੇ ਵੱਖਰਾ ਫੈਸਲਾ ਕਰਨ ਉੱਤੇ ਇਹ ਮੁੜ ਜਾਂਚ ਲਈ ਆਵੇਗਾ।',
    ],
  'The resolution is a new operation with causal references to the alternatives. Independent conflicting resolutions remain reviewable.':
    [
      'समाधान एक नई प्रविष्टि है जो विकल्पों का संदर्भ रखती है। अलग-अलग विरोधी समाधान जाँच के लिए बने रहते हैं।',
      'ਹੱਲ ਇੱਕ ਨਵੀਂ ਐਂਟਰੀ ਹੈ ਜੋ ਵਿਕਲਪਾਂ ਦੇ ਹਵਾਲੇ ਰੱਖਦੀ ਹੈ। ਵੱਖ-ਵੱਖ ਵਿਰੋਧੀ ਹੱਲ ਜਾਂਚ ਲਈ ਰਹਿੰਦੇ ਹਨ।',
    ],
  'Workspace / Synchronization': ['कार्यक्षेत्र / सिंक', 'ਕਾਰਜ-ਖੇਤਰ / ਸਿੰਕ'],
  'Save & share': ['सहेजें और साझा करें', 'ਸੰਭਾਲੋ ਅਤੇ ਸਾਂਝਾ ਕਰੋ'],
  'Sync center': ['सिंक केंद्र', 'ਸਿੰਕ ਕੇਂਦਰ'],
  'Your entries save on this device first. Copy them to the village hub when a connection is available.': [
    'आपकी प्रविष्टियाँ पहले इस डिवाइस पर सहेजी जाती हैं। कनेक्शन मिलने पर इन्हें गाँव के हब पर कॉपी करें।',
    'ਤੁਹਾਡੀਆਂ ਐਂਟਰੀਆਂ ਪਹਿਲਾਂ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੀਆਂ ਜਾਂਦੀਆਂ ਹਨ। ਕਨੈਕਸ਼ਨ ਮਿਲਣ ਉੱਤੇ ਇਨ੍ਹਾਂ ਨੂੰ ਪਿੰਡ ਦੇ ਹੱਬ ਉੱਤੇ ਕਾਪੀ ਕਰੋ।',
  ],
  'Local durability and hub backup are different promises. See exactly where your work lives.': [
    'डिवाइस पर सहेजना और हब पर बैकअप अलग बातें हैं। देखें कि आपका काम कहाँ सुरक्षित है।',
    'ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲਣਾ ਅਤੇ ਹੱਬ ਉੱਤੇ ਬੈਕਅੱਪ ਵੱਖਰੀਆਂ ਗੱਲਾਂ ਹਨ। ਵੇਖੋ ਤੁਹਾਡਾ ਕੰਮ ਕਿੱਥੇ ਸੁਰੱਖਿਅਤ ਹੈ।',
  ],
  'Sync with village hub': ['गाँव के हब से सिंक करें', 'ਪਿੰਡ ਦੇ ਹੱਬ ਨਾਲ ਸਿੰਕ ਕਰੋ'],
  'Your local records remain saved. Reconnect to the hub and retry.': [
    'आपके स्थानीय रिकॉर्ड सुरक्षित हैं। हब से जुड़कर फिर कोशिश करें।',
    'ਤੁਹਾਡੇ ਸਥਾਨਕ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹਨ। ਹੱਬ ਨਾਲ ਜੁੜ ਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  ],
  'Saved on this device': ['इस डिवाइस पर सहेजा गया', 'ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲਿਆ'],
  'Durable on this device': ['इस डिवाइस पर सुरक्षित', 'ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੁਰੱਖਿਅਤ'],
  'Encrypted and kept here': ['एन्क्रिप्ट करके यहीं रखा गया', 'ਇਨਕ੍ਰਿਪਟ ਕਰਕੇ ਇੱਥੇ ਰੱਖਿਆ'],
  'Encrypted IndexedDB commit': ['एन्क्रिप्ट किया गया IndexedDB रिकॉर्ड', 'ਇਨਕ੍ਰਿਪਟ ਕੀਤਾ IndexedDB ਰਿਕਾਰਡ'],
  'Waiting to share': ['साझा करने की प्रतीक्षा', 'ਸਾਂਝਾ ਕਰਨ ਦੀ ਉਡੀਕ'],
  'Waiting for backup': ['बैकअप की प्रतीक्षा', 'ਬੈਕਅੱਪ ਦੀ ਉਡੀਕ'],
  'Copy when connected': ['कनेक्शन मिलने पर कॉपी करें', 'ਕਨੈਕਸ਼ਨ ਮਿਲਣ ਉੱਤੇ ਕਾਪੀ ਕਰੋ'],
  'Not yet acknowledged by hub': ['हब से अभी पुष्टि नहीं मिली', 'ਹੱਬ ਤੋਂ ਹਾਲੇ ਪੁਸ਼ਟੀ ਨਹੀਂ ਮਿਲੀ'],
  'Differences to check': ['जाँचने वाले अंतर', 'ਜਾਂਚਣ ਵਾਲੇ ਫ਼ਰਕ'],
  'Preserved conflicts': ['सुरक्षित विरोधी बदलाव', 'ਸੁਰੱਖਿਅਤ ਵਿਰੋਧੀ ਤਬਦੀਲੀਆਂ'],
  'Original entries are kept': ['मूल प्रविष्टियाँ सुरक्षित हैं', 'ਅਸਲ ਐਂਟਰੀਆਂ ਸੁਰੱਖਿਅਤ ਹਨ'],
  'Every alternative kept': ['हर विकल्प सुरक्षित', 'ਹਰ ਵਿਕਲਪ ਸੁਰੱਖਿਅਤ'],
  'Last copied to hub': ['हब पर पिछली कॉपी', 'ਹੱਬ ਉੱਤੇ ਪਿਛਲੀ ਕਾਪੀ'],
  'Last hub backup': ['हब पर पिछला बैकअप', 'ਹੱਬ ਉੱਤੇ ਪਿਛਲਾ ਬੈਕਅੱਪ'],
  'Completed {date}': ['पूरा हुआ: {date}', 'ਪੂਰਾ ਹੋਇਆ: {date}'],
  'No completed copy yet': ['अभी कोई कॉपी पूरी नहीं हुई', 'ਹਾਲੇ ਕੋਈ ਕਾਪੀ ਪੂਰੀ ਨਹੀਂ ਹੋਈ'],
  'Durable cursor: {cursor}': ['सुरक्षित कर्सर: {cursor}', 'ਸੁਰੱਖਿਅਤ ਕਰਸਰ: {cursor}'],
  'Last successful transfer': ['पिछला सफल स्थानांतरण', 'ਪਿਛਲਾ ਸਫਲ ਤਬਾਦਲਾ'],
  'Operations pushed / pulled': ['भेजे / प्राप्त किए बदलाव', 'ਭੇਜੀਆਂ / ਪ੍ਰਾਪਤ ਤਬਦੀਲੀਆਂ'],
  'JSON payload sent + received': ['भेजा + प्राप्त JSON डेटा', 'ਭੇਜਿਆ + ਪ੍ਰਾਪਤ JSON ਡਾਟਾ'],
  'End-to-end duration': ['कुल लगा समय', 'ਕੁੱਲ ਲੱਗਿਆ ਸਮਾਂ'],
  ms: ['मिलीसेकंड', 'ਮਿਲੀਸਕਿੰਟ'],
  'Committed chunks': ['सहेजे गए हिस्से', 'ਸੰਭਾਲੇ ਹਿੱਸੇ'],
  Checkpoint: ['जाँच बिंदु', 'ਜਾਂਚ ਬਿੰਦੂ'],
  'Ready for the first journey': ['पहली बार सिंक करने के लिए तैयार', 'ਪਹਿਲੀ ਵਾਰ ਸਿੰਕ ਕਰਨ ਲਈ ਤਿਆਰ'],
  'Connect to your village hub and start synchronization.': [
    'अपने गाँव के हब से जुड़कर सिंक शुरू करें।',
    'ਆਪਣੇ ਪਿੰਡ ਦੇ ਹੱਬ ਨਾਲ ਜੁੜ ਕੇ ਸਿੰਕ ਸ਼ੁਰੂ ਕਰੋ।',
  ],
  'Payload counts include serialized request and response bodies. HTTP/TLS headers and retransmission bytes are not measured.':
    [
      'डेटा की मात्रा में भेजे और प्राप्त किए गए संदेश शामिल हैं। HTTP/TLS हेडर और दोबारा भेजे बाइट नहीं गिने गए।',
      'ਡਾਟੇ ਦੀ ਮਾਤਰਾ ਵਿੱਚ ਭੇਜੇ ਅਤੇ ਪ੍ਰਾਪਤ ਸੁਨੇਹੇ ਸ਼ਾਮਲ ਹਨ। HTTP/TLS ਹੈਡਰ ਅਤੇ ਮੁੜ ਭੇਜੇ ਬਾਈਟ ਨਹੀਂ ਗਿਣੇ ਗਏ।',
    ],
  'Integrity, with evidence': ['प्रमाण सहित अखंडता', 'ਸਬੂਤ ਸਮੇਤ ਅਖੰਡਤਾ'],
  'immutable operations': ['अपरिवर्तनीय प्रविष्टियाँ', 'ਨਾ ਬਦਲਣਯੋਗ ਐਂਟਰੀਆਂ'],
  'Preserved locally, including original alternatives': [
    'मूल विकल्पों सहित डिवाइस पर सुरक्षित',
    'ਅਸਲ ਵਿਕਲਪਾਂ ਸਮੇਤ ਡਿਵਾਈਸ ਉੱਤੇ ਸੁਰੱਖਿਅਤ',
  ],
  'CANONICAL LOG · SHA-256': ['मानक लॉग · SHA-256', 'ਮਿਆਰੀ ਲੌਗ · SHA-256'],
  'This digest detects log differences. Compare it with the hub digest after full synchronization. It is a whole-log digest, not a Merkle repair tree.':
    [
      'यह डाइजेस्ट लॉग के अंतर पहचानता है। पूरा सिंक होने के बाद इसे हब के डाइजेस्ट से मिलाएँ। यह पूरे लॉग का डाइजेस्ट है, Merkle मरम्मत ट्री नहीं।',
      'ਇਹ ਡਾਈਜੈਸਟ ਲੌਗ ਦੇ ਫ਼ਰਕ ਪਛਾਣਦਾ ਹੈ। ਪੂਰਾ ਸਿੰਕ ਹੋਣ ਤੋਂ ਬਾਅਦ ਇਸ ਨੂੰ ਹੱਬ ਦੇ ਡਾਈਜੈਸਟ ਨਾਲ ਮਿਲਾਓ। ਇਹ ਪੂਰੇ ਲੌਗ ਦਾ ਡਾਈਜੈਸਟ ਹੈ, Merkle ਮੁਰੰਮਤ ਟ੍ਰੀ ਨਹੀਂ।',
    ],
  'Quarantined operations:': ['अलग रखी गई प्रविष्टियाँ:', 'ਵੱਖ ਰੱਖੀਆਂ ਐਂਟਰੀਆਂ:'],
  'Operation ledger': ['बदलावों का रजिस्टर', 'ਤਬਦੀਲੀਆਂ ਦਾ ਰਜਿਸਟਰ'],
  'Showing latest 40 · originals never removed': [
    'नवीनतम 40 दिखाए गए · मूल प्रविष्टियाँ नहीं हटतीं',
    'ਨਵੀਆਂ 40 ਦਿਖਾਈਆਂ · ਅਸਲ ਐਂਟਰੀਆਂ ਨਹੀਂ ਹਟਦੀਆਂ',
  ],
  OPERATION: ['बदलाव', 'ਤਬਦੀਲੀ'],
  'RECORD & FIELD': ['रिकॉर्ड और खाना', 'ਰਿਕਾਰਡ ਅਤੇ ਖਾਨਾ'],
  AUTHOR: ['लेखक', 'ਲੇਖਕ'],
  'BACKUP STATE': ['बैकअप की स्थिति', 'ਬੈਕਅੱਪ ਦੀ ਹਾਲਤ'],
  '· HLC': ['· HLC', '· HLC'],
  'Only on this device': ['केवल इस डिवाइस पर', 'ਕੇਵਲ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ'],
  'At hub / received': ['हब पर / प्राप्त', 'ਹੱਬ ਉੱਤੇ / ਪ੍ਰਾਪਤ'],
  'Some entries disagree. Original entries are kept.': [
    'कुछ प्रविष्टियाँ अलग हैं। मूल प्रविष्टियाँ सुरक्षित हैं।',
    'ਕੁਝ ਐਂਟਰੀਆਂ ਵੱਖਰੀਆਂ ਹਨ। ਅਸਲ ਐਂਟਰੀਆਂ ਸੁਰੱਖਿਅਤ ਹਨ।',
  ],
  'Check the differences before making a decision.': [
    'निर्णय लेने से पहले अंतर जाँचें।',
    'ਫੈਸਲਾ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਫ਼ਰਕ ਜਾਂਚੋ।',
  ],
  'Changes need attention': ['बदलावों की जाँच ज़रूरी है', 'ਤਬਦੀਲੀਆਂ ਦੀ ਜਾਂਚ ਲੋੜੀਂਦੀ ਹੈ'],
  'changes were set aside by the hub. Your saved local records are kept. Ask an administrator to check the reasons below.':
    [
      'बदलाव हब ने अलग रखे हैं। आपके स्थानीय रिकॉर्ड सुरक्षित हैं। नीचे दिए कारणों की जाँच के लिए प्रशासक से कहें।',
      'ਤਬਦੀਲੀਆਂ ਹੱਬ ਨੇ ਵੱਖ ਰੱਖੀਆਂ ਹਨ। ਤੁਹਾਡੇ ਸਥਾਨਕ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹਨ। ਹੇਠਲੇ ਕਾਰਨਾਂ ਦੀ ਜਾਂਚ ਲਈ ਪ੍ਰਬੰਧਕ ਨੂੰ ਕਹੋ।',
    ],
  'Technical details and change history': [
    'तकनीकी जानकारी और बदलावों का इतिहास',
    'ਤਕਨੀਕੀ ਜਾਣਕਾਰੀ ਅਤੇ ਤਬਦੀਲੀਆਂ ਦਾ ਇਤਿਹਾਸ',
  ],
  '06 / CURIOSITY HAS NO BOUNDARIES': ['06 / सीखने की कोई सीमा नहीं', '06 / ਸਿੱਖਣ ਦੀ ਕੋਈ ਹੱਦ ਨਹੀਂ'],
  'Learning library': ['शिक्षण पुस्तकालय', 'ਸਿੱਖਿਆ ਲਾਇਬ੍ਰੇਰੀ'],
  'Discover illustrated offline lessons and official government education and health resources.': [
    'चित्रों वाले ऑफलाइन पाठ और सरकारी शिक्षा व स्वास्थ्य संसाधन खोजें।',
    'ਤਸਵੀਰਾਂ ਵਾਲੇ ਆਫਲਾਈਨ ਪਾਠ ਅਤੇ ਸਰਕਾਰੀ ਸਿੱਖਿਆ ਤੇ ਸਿਹਤ ਸਰੋਤ ਲੱਭੋ।',
  ],
  'Your learning space': ['आपकी सीखने की जगह', 'ਤੁਹਾਡੀ ਸਿੱਖਣ ਦੀ ਥਾਂ'],
  'A LITTLE CURIOSITY, EVERY DAY': ['हर दिन कुछ नया जानें', 'ਹਰ ਦਿਨ ਕੁਝ ਨਵਾਂ ਜਾਣੋ'],
  'A small lesson.': ['एक छोटा पाठ।', 'ਇੱਕ ਛੋਟਾ ਪਾਠ।'],
  'A bigger world.': ['एक बड़ी दुनिया।', 'ਇੱਕ ਵੱਡੀ ਦੁਨੀਆ।'],
  'Read a story, explore a question, or discover an official programme. Start here and learn at your own pace.':
    [
      'कहानी पढ़ें, कोई सवाल खोजें या सरकारी योजना जानें। यहाँ शुरू करें और अपनी गति से सीखें।',
      'ਕਹਾਣੀ ਪੜ੍ਹੋ, ਕੋਈ ਸਵਾਲ ਖੋਜੋ ਜਾਂ ਸਰਕਾਰੀ ਯੋਜਨਾ ਜਾਣੋ। ਇੱਥੋਂ ਸ਼ੁਰੂ ਕਰੋ ਅਤੇ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਸਿੱਖੋ।',
    ],
  'Start an offline lesson': ['ऑफलाइन पाठ शुरू करें', 'ਆਫਲਾਈਨ ਪਾਠ ਸ਼ੁਰੂ ਕਰੋ'],
  'Explore programmes': ['योजनाएँ देखें', 'ਯੋਜਨਾਵਾਂ ਵੇਖੋ'],
  'offline lessons': ['ऑफलाइन पाठ', 'ਆਫਲਾਈਨ ਪਾਠ'],
  'official programmes': ['सरकारी योजनाएँ', 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ'],
  '{count} saved practice attempt': ['अभ्यास की {count} कोशिश सहेजी गई', 'ਅਭਿਆਸ ਦੀ {count} ਕੋਸ਼ਿਸ਼ ਸੰਭਾਲੀ'],
  '{count} saved practice attempts': [
    'अभ्यास की {count} कोशिशें सहेजी गईं',
    'ਅਭਿਆਸ ਦੀਆਂ {count} ਕੋਸ਼ਿਸ਼ਾਂ ਸੰਭਾਲੀਆਂ',
  ],
  'Official DIKSHA banner showing schoolchildren exploring digital learning': [
    'डिजिटल शिक्षा लेते स्कूली बच्चों का आधिकारिक DIKSHA बैनर',
    'ਡਿਜੀਟਲ ਸਿੱਖਿਆ ਲੈਂਦੇ ਸਕੂਲੀ ਬੱਚਿਆਂ ਦਾ ਅਧਿਕਾਰਤ DIKSHA ਬੈਨਰ',
  ],
  'Image: Ministry of Education ·': ['चित्र: शिक्षा मंत्रालय ·', 'ਤਸਵੀਰ: ਸਿੱਖਿਆ ਮੰਤਰਾਲਾ ·'],
  'DIKSHA official banner': ['DIKSHA आधिकारिक बैनर', 'DIKSHA ਅਧਿਕਾਰਤ ਬੈਨਰ'],
  'LEARN, TRY, REMEMBER': ['सीखें, कोशिश करें, याद रखें', 'ਸਿੱਖੋ, ਕੋਸ਼ਿਸ਼ ਕਰੋ, ਯਾਦ ਰੱਖੋ'],
  'Original Smriva activities · Your quiz attempts save on this device.': [
    'Smriva की मौलिक गतिविधियाँ · प्रश्नोत्तरी की कोशिशें इसी डिवाइस पर सहेजी जाती हैं।',
    'Smriva ਦੀਆਂ ਮੂਲ ਗਤੀਵਿਧੀਆਂ · ਪ੍ਰਸ਼ਨੋਤਰੀ ਦੀਆਂ ਕੋਸ਼ਿਸ਼ਾਂ ਇਸੇ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।',
  ],
  'Filter learning resources': ['शिक्षण संसाधन छाँटें', 'ਸਿੱਖਿਆ ਸਰੋਤ ਛਾਂਟੋ'],
  'All subjects': ['सभी विषय', 'ਸਾਰੇ ਵਿਸ਼ੇ'],
  Mathematics: ['गणित', 'ਗਣਿਤ'],
  Science: ['विज्ञान', 'ਵਿਗਿਆਨ'],
  Reading: ['पढ़ना', 'ਪੜ੍ਹਨਾ'],
  'Health literacy': ['स्वास्थ्य की जानकारी', 'ਸਿਹਤ ਦੀ ਜਾਣਕਾਰੀ'],
  'Smriva original content · CC BY 4.0 · English': [
    'Smriva की मौलिक सामग्री · CC BY 4.0 · पाठ अंग्रेज़ी में हैं',
    'Smriva ਦੀ ਮੂਲ ਸਮੱਗਰੀ · CC BY 4.0 · ਪਾਠ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ',
  ],
  'Available offline': ['ऑफलाइन उपलब्ध', 'ਆਫਲਾਈਨ ਉਪਲਬਧ'],
  'Open {title} · {duration}': ['{title} खोलें · {duration}', '{title} ਖੋਲ੍ਹੋ · {duration}'],
  'Remove cached pack {title}': ['कैश किया पैक हटाएँ: {title}', 'ਕੈਸ਼ ਕੀਤਾ ਪੈਕ ਹਟਾਓ: {title}'],
  'Download lesson pack {title}': ['पाठ पैक डाउनलोड करें: {title}', 'ਪਾਠ ਪੈਕ ਡਾਊਨਲੋਡ ਕਰੋ: {title}'],
  'Extra lesson caching is unavailable. The original lessons remain bundled with the app.': [
    'अतिरिक्त पाठ कैश उपलब्ध नहीं है। मूल पाठ ऐप में मौजूद हैं।',
    'ਵਾਧੂ ਪਾਠ ਕੈਸ਼ ਉਪਲਬਧ ਨਹੀਂ। ਅਸਲ ਪਾਠ ਐਪ ਵਿੱਚ ਮੌਜੂਦ ਹਨ।',
  ],
  'Extra cached pack removed. The bundled lesson remains available.': [
    'अतिरिक्त कैश पैक हटाया गया। ऐप में मौजूद पाठ उपलब्ध रहेगा।',
    'ਵਾਧੂ ਕੈਸ਼ ਪੈਕ ਹਟਾਇਆ ਗਿਆ। ਐਪ ਵਿੱਚ ਮੌਜੂਦ ਪਾਠ ਉਪਲਬਧ ਰਹੇਗਾ।',
  ],
  'Lesson pack stored in the offline cache': [
    'पाठ पैक ऑफलाइन कैश में सहेजा गया',
    'ਪਾਠ ਪੈਕ ਆਫਲਾਈਨ ਕੈਸ਼ ਵਿੱਚ ਸੰਭਾਲਿਆ ਗਿਆ',
  ],
  'The extra lesson pack could not be cached. Your practice records are unchanged; try again when device storage is available.':
    [
      'अतिरिक्त पाठ पैक कैश नहीं हुआ। आपके अभ्यास रिकॉर्ड सुरक्षित हैं; डिवाइस में जगह होने पर फिर कोशिश करें।',
      'ਵਾਧੂ ਪਾਠ ਪੈਕ ਕੈਸ਼ ਨਹੀਂ ਹੋਇਆ। ਤੁਹਾਡੇ ਅਭਿਆਸ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹਨ; ਡਿਵਾਈਸ ਵਿੱਚ ਥਾਂ ਹੋਣ ਉੱਤੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    ],
  'Further learning, with clear boundaries': ['और सीखने के संसाधन', 'ਹੋਰ ਸਿੱਖਣ ਦੇ ਸਰੋਤ'],
  'Explore more collections online. Their websites and materials are not downloaded by Smriva.': [
    'और संग्रह ऑनलाइन देखें। Smriva उनकी वेबसाइट और सामग्री डाउनलोड नहीं करता।',
    'ਹੋਰ ਸੰਗ੍ਰਹਿ ਆਨਲਾਈਨ ਵੇਖੋ। Smriva ਉਨ੍ਹਾਂ ਦੀ ਵੈੱਬਸਾਈਟ ਅਤੇ ਸਮੱਗਰੀ ਡਾਊਨਲੋਡ ਨਹੀਂ ਕਰਦਾ।',
  ],
  DIKSHA: ['DIKSHA', 'DIKSHA'],
  'PhET offline access guide': ['PhET ऑफलाइन उपयोग मार्गदर्शिका', 'PhET ਆਫਲਾਈਨ ਵਰਤੋਂ ਗਾਈਡ'],
  'OpenStax textbooks': ['OpenStax पाठ्यपुस्तकें', 'OpenStax ਪਾਠ-ਪੁਸਤਕਾਂ'],
  'Give it a try': ['कोशिश करके देखें', 'ਕੋਸ਼ਿਸ਼ ਕਰਕੇ ਵੇਖੋ'],
  'Check & save my progress': ['जाँचें और मेरी प्रगति सहेजें', 'ਜਾਂਚੋ ਅਤੇ ਮੇਰੀ ਤਰੱਕੀ ਸੰਭਾਲੋ'],
  'That’s right. Your progress is saved.': [
    'सही जवाब। आपकी प्रगति सहेजी गई है।',
    'ਸਹੀ ਜਵਾਬ। ਤੁਹਾਡੀ ਤਰੱਕੀ ਸੰਭਾਲੀ ਗਈ ਹੈ।',
  ],
  'A good try. Read the lesson and give it another go. Your attempt is saved.': [
    'अच्छी कोशिश। पाठ पढ़कर फिर कोशिश करें। आपकी कोशिश सहेजी गई है।',
    'ਵਧੀਆ ਕੋਸ਼ਿਸ਼। ਪਾਠ ਪੜ੍ਹ ਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ। ਤੁਹਾਡੀ ਕੋਸ਼ਿਸ਼ ਸੰਭਾਲੀ ਗਈ ਹੈ।',
  ],
  'Original text by the Smriva project · CC BY 4.0 · Not clinical advice': [
    'मूल पाठ: Smriva प्रोजेक्ट · CC BY 4.0 · चिकित्सकीय सलाह नहीं',
    'ਮੂਲ ਪਾਠ: Smriva ਪ੍ਰੋਜੈਕਟ · CC BY 4.0 · ਡਾਕਟਰੀ ਸਲਾਹ ਨਹੀਂ',
  ],
  '07 / KEEP YOUR WORK IN SAFE HANDS': ['07 / अपना काम सुरक्षित रखें', '07 / ਆਪਣਾ ਕੰਮ ਸੁਰੱਖਿਅਤ ਰੱਖੋ'],
  'Settings & recovery': ['सेटिंग और पुनर्प्राप्ति', 'ਸੈਟਿੰਗਾਂ ਅਤੇ ਮੁੜ-ਪ੍ਰਾਪਤੀ'],
  'A backup is a second chance. A recovery code brings synchronized records to a new device.': [
    'बैकअप से काम वापस मिल सकता है। रिकवरी कोड सिंक किए रिकॉर्ड नए डिवाइस पर लाता है।',
    'ਬੈਕਅੱਪ ਨਾਲ ਕੰਮ ਵਾਪਸ ਮਿਲ ਸਕਦਾ ਹੈ। ਰਿਕਵਰੀ ਕੋਡ ਸਿੰਕ ਕੀਤੇ ਰਿਕਾਰਡ ਨਵੇਂ ਡਿਵਾਈਸ ਉੱਤੇ ਲਿਆਉਂਦਾ ਹੈ।',
  ],
  'Encrypted backup & restore': ['एन्क्रिप्टेड बैकअप और वापसी', 'ਇਨਕ੍ਰਿਪਟਡ ਬੈਕਅੱਪ ਅਤੇ ਬਹਾਲੀ'],
  'Backup passphrase (at least 10 characters)': [
    'बैकअप पासफ्रेज़ (कम से कम 10 अक्षर)',
    'ਬੈਕਅੱਪ ਪਾਸਫ੍ਰੇਜ਼ (ਘੱਟੋ-ਘੱਟ 10 ਅੱਖਰ)',
  ],
  'Export backup': ['बैकअप डाउनलोड करें', 'ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਕਰੋ'],
  'Import backup': ['बैकअप लाएँ', 'ਬੈਕਅੱਪ ਲਿਆਓ'],
  'Encrypted backup exported. Keep the passphrase separately.': [
    'एन्क्रिप्टेड बैकअप डाउनलोड हुआ। पासफ्रेज़ अलग सुरक्षित रखें।',
    'ਇਨਕ੍ਰਿਪਟਡ ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਹੋਇਆ। ਪਾਸਫ੍ਰੇਜ਼ ਵੱਖਰਾ ਸੁਰੱਖਿਅਤ ਰੱਖੋ।',
  ],
  '{count} validated operations restored locally': [
    '{count} सत्यापित प्रविष्टियाँ इस डिवाइस पर वापस लाई गईं',
    '{count} ਤਸਦੀਕ ਕੀਤੀਆਂ ਐਂਟਰੀਆਂ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਬਹਾਲ ਕੀਤੀਆਂ',
  ],
  'AES-256-GCM with an independent PBKDF2-derived backup key. The backup contains operations, not your hub credentials.':
    [
      'अलग PBKDF2 बैकअप कुंजी के साथ AES-256-GCM सुरक्षा। बैकअप में प्रविष्टियाँ होती हैं, हब के लॉगिन विवरण नहीं।',
      'ਵੱਖਰੀ PBKDF2 ਬੈਕਅੱਪ ਕੁੰਜੀ ਨਾਲ AES-256-GCM ਸੁਰੱਖਿਆ। ਬੈਕਅੱਪ ਵਿੱਚ ਐਂਟਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ, ਹੱਬ ਦੇ ਲੌਗਇਨ ਵੇਰਵੇ ਨਹੀਂ।',
    ],
  'Unsynchronized records on a lost device cannot be recovered unless you exported a backup. Keep a backup before replacing a device.':
    [
      'खोए डिवाइस के बिना सिंक वाले रिकॉर्ड केवल डाउनलोड किए बैकअप से वापस मिल सकते हैं। डिवाइस बदलने से पहले बैकअप रखें।',
      'ਗੁੰਮ ਡਿਵਾਈਸ ਦੇ ਬਿਨਾਂ ਸਿੰਕ ਵਾਲੇ ਰਿਕਾਰਡ ਕੇਵਲ ਡਾਊਨਲੋਡ ਕੀਤੇ ਬੈਕਅੱਪ ਨਾਲ ਬਹਾਲ ਹੋ ਸਕਦੇ ਹਨ। ਡਿਵਾਈਸ ਬਦਲਣ ਤੋਂ ਪਹਿਲਾਂ ਬੈਕਅੱਪ ਰੱਖੋ।',
    ],
  'Device identity': ['डिवाइस की पहचान', 'ਡਿਵਾਈਸ ਦੀ ਪਛਾਣ'],
  'Name / role': ['नाम / भूमिका', 'ਨਾਮ / ਭੂਮਿਕਾ'],
  'Offline session expires': ['ऑफलाइन सत्र की समाप्ति', 'ਆਫਲਾਈਨ ਸੈਸ਼ਨ ਦੀ ਮਿਆਦ'],
  Storage: ['स्टोरेज', 'ਸਟੋਰੇਜ'],
  'Checking…': ['जाँच रहे हैं…', 'ਜਾਂਚ ਰਹੇ ਹਾਂ…'],
  '{used} used / {quota} available quota': [
    '{used} उपयोग / {quota} उपलब्ध सीमा',
    '{used} ਵਰਤੋਂ / {quota} ਉਪਲਬਧ ਹੱਦ',
  ],
  'Local lock': ['स्थानीय लॉक', 'ਸਥਾਨਕ ਲੌਕ'],
  '15 minutes of inactivity': ['15 मिनट कोई गतिविधि न होने पर', '15 ਮਿੰਟ ਕੋਈ ਗਤੀਵਿਧੀ ਨਾ ਹੋਣ ਉੱਤੇ'],
  'Lock workspace now': ['कार्यक्षेत्र अभी लॉक करें', 'ਕਾਰਜ-ਖੇਤਰ ਹੁਣ ਲੌਕ ਕਰੋ'],
  'Renew offline session online': ['ऑनलाइन जुड़कर ऑफलाइन सत्र बढ़ाएँ', 'ਆਨਲਾਈਨ ਜੁੜ ਕੇ ਆਫਲਾਈਨ ਸੈਸ਼ਨ ਵਧਾਓ'],
  'Online session verified. Offline access renewed until {date}': [
    'ऑनलाइन सत्र सत्यापित। ऑफलाइन पहुँच {date} तक बढ़ाई गई',
    'ਆਨਲਾਈਨ ਸੈਸ਼ਨ ਤਸਦੀਕ ਹੋਇਆ। ਆਫਲਾਈਨ ਪਹੁੰਚ {date} ਤੱਕ ਵਧਾਈ ਗਈ',
  ],
  'A code for a lost-phone day': ['फोन खोने पर काम आने वाला कोड', 'ਫ਼ੋਨ ਗੁੰਮਣ ਉੱਤੇ ਕੰਮ ਆਉਣ ਵਾਲਾ ਕੋਡ'],
  'Store this code somewhere safe. Anyone holding it can recover your synchronized demo workspace on a fresh device. Recovery revokes the previous device.':
    [
      'यह कोड सुरक्षित रखें। इसके धारक नए डिवाइस पर आपका सिंक किया डेमो कार्यक्षेत्र वापस ला सकते हैं। रिकवरी पिछले डिवाइस की अनुमति रद्द कर देती है।',
      'ਇਹ ਕੋਡ ਸੁਰੱਖਿਅਤ ਰੱਖੋ। ਇਸ ਨੂੰ ਰੱਖਣ ਵਾਲਾ ਨਵੇਂ ਡਿਵਾਈਸ ਉੱਤੇ ਤੁਹਾਡਾ ਸਿੰਕ ਕੀਤਾ ਡੈਮੋ ਕਾਰਜ-ਖੇਤਰ ਬਹਾਲ ਕਰ ਸਕਦਾ ਹੈ। ਰਿਕਵਰੀ ਪਿਛਲੇ ਡਿਵਾਈਸ ਦੀ ਇਜਾਜ਼ਤ ਰੱਦ ਕਰਦੀ ਹੈ।',
    ],
  'Hide recovery code': ['रिकवरी कोड छिपाएँ', 'ਰਿਕਵਰੀ ਕੋਡ ਲੁਕਾਓ'],
  'Reveal recovery code': ['रिकवरी कोड दिखाएँ', 'ਰਿਕਵਰੀ ਕੋਡ ਵਿਖਾਓ'],
  'An offline revoked device can still unlock until it reconnects. New uploads from revoked devices are rejected or quarantined.':
    [
      'अनुमति रद्द किया ऑफलाइन डिवाइस दोबारा जुड़ने तक खुल सकता है। ऐसे डिवाइस के नए अपलोड अस्वीकार या अलग रखे जाते हैं।',
      'ਇਜਾਜ਼ਤ ਰੱਦ ਕੀਤਾ ਆਫਲਾਈਨ ਡਿਵਾਈਸ ਮੁੜ ਜੁੜਨ ਤੱਕ ਖੁੱਲ੍ਹ ਸਕਦਾ ਹੈ। ਅਜਿਹੇ ਡਿਵਾਈਸ ਦੇ ਨਵੇਂ ਅੱਪਲੋਡ ਰੱਦ ਜਾਂ ਵੱਖ ਰੱਖੇ ਜਾਂਦੇ ਹਨ।',
    ],
  'Open recovery on a new device': ['नए डिवाइस पर रिकवरी खोलें', 'ਨਵੇਂ ਡਿਵਾਈਸ ਉੱਤੇ ਰਿਕਵਰੀ ਖੋਲ੍ਹੋ'],
  'Carry records without a network': ['बिना नेटवर्क रिकॉर्ड ले जाएँ', 'ਬਿਨਾਂ ਨੈੱਟਵਰਕ ਰਿਕਾਰਡ ਲੈ ਜਾਓ'],
  'Export a signed, encrypted hub bundle for USB transfer between hubs that share a trust key. Hub access is needed to create or ingest the bundle.':
    [
      'एक ही विश्वसनीय कुंजी वाले हबों के बीच USB से ले जाने के लिए हस्ताक्षरित, एन्क्रिप्टेड बंडल डाउनलोड करें। बंडल बनाने या लाने के लिए हब तक पहुँच चाहिए।',
      'ਇੱਕੋ ਭਰੋਸੇਯੋਗ ਕੁੰਜੀ ਵਾਲੇ ਹੱਬਾਂ ਵਿਚਕਾਰ USB ਨਾਲ ਲਿਜਾਣ ਲਈ ਦਸਤਖ਼ਤ ਕੀਤਾ, ਇਨਕ੍ਰਿਪਟਡ ਬੰਡਲ ਡਾਊਨਲੋਡ ਕਰੋ। ਬੰਡਲ ਬਣਾਉਣ ਜਾਂ ਲਿਆਉਣ ਲਈ ਹੱਬ ਤੱਕ ਪਹੁੰਚ ਚਾਹੀਦੀ ਹੈ।',
    ],
  'Export hub bundle': ['हब बंडल डाउनलोड करें', 'ਹੱਬ ਬੰਡਲ ਡਾਊਨਲੋਡ ਕਰੋ'],
  'Import at hub': ['हब पर लाएँ', 'ਹੱਬ ਉੱਤੇ ਲਿਆਓ'],
  'Signed encrypted hub bundle exported': [
    'हस्ताक्षरित एन्क्रिप्टेड हब बंडल डाउनलोड हुआ',
    'ਦਸਤਖ਼ਤ ਕੀਤਾ ਇਨਕ੍ਰਿਪਟਡ ਹੱਬ ਬੰਡਲ ਡਾਊਨਲੋਡ ਹੋਇਆ',
  ],
  '{count} operations ingested idempotently': [
    '{count} प्रविष्टियाँ बिना दोहराव हब पर ली गईं',
    '{count} ਐਂਟਰੀਆਂ ਬਿਨਾਂ ਦੁਹਰਾਅ ਹੱਬ ਉੱਤੇ ਲਈਆਂ',
  ],
  'Signature: HMAC-SHA-256. Payload: AES-GCM. A foreign hub key is rejected.': [
    'हस्ताक्षर: HMAC-SHA-256। डेटा: AES-GCM। अलग हब कुंजी अस्वीकार होती है।',
    'ਦਸਤਖ਼ਤ: HMAC-SHA-256। ਡਾਟਾ: AES-GCM। ਵੱਖਰੀ ਹੱਬ ਕੁੰਜੀ ਰੱਦ ਹੁੰਦੀ ਹੈ।',
  ],
  'Official programme': ['आधिकारिक योजना', 'ਅਧਿਕਾਰਤ ਯੋਜਨਾ'],
  'Official resources': ['आधिकारिक संसाधन', 'ਅਧਿਕਾਰਤ ਸਰੋਤ'],
  'Explore government programmes': ['सरकारी योजनाएँ देखें', 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਵੇਖੋ'],
  'Find official education and health resources. Open a programme’s own website to read its current information.':
    [
      'आधिकारिक शिक्षा और स्वास्थ्य संसाधन खोजें। ताज़ा जानकारी के लिए योजना की अपनी वेबसाइट खोलें।',
      'ਅਧਿਕਾਰਤ ਸਿੱਖਿਆ ਅਤੇ ਸਿਹਤ ਸਰੋਤ ਲੱਭੋ। ਤਾਜ਼ਾ ਜਾਣਕਾਰੀ ਲਈ ਯੋਜਨਾ ਦੀ ਆਪਣੀ ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹੋ।',
    ],
  'These are informational links to government websites. Smriva is an independent project and is not affiliated with these programmes.':
    [
      'ये सरकारी वेबसाइटों की जानकारी के लिंक हैं। Smriva स्वतंत्र प्रोजेक्ट है और इन योजनाओं से संबद्ध नहीं है।',
      'ਇਹ ਸਰਕਾਰੀ ਵੈੱਬਸਾਈਟਾਂ ਦੀ ਜਾਣਕਾਰੀ ਦੇ ਲਿੰਕ ਹਨ। Smriva ਸੁਤੰਤਰ ਪ੍ਰੋਜੈਕਟ ਹੈ ਅਤੇ ਇਨ੍ਹਾਂ ਯੋਜਨਾਵਾਂ ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ।',
    ],
  'You are offline. You can browse the programme information here. Official websites need an internet connection.':
    [
      'आप ऑफलाइन हैं। यहाँ योजना की जानकारी देख सकते हैं। आधिकारिक वेबसाइटों के लिए इंटरनेट चाहिए।',
      'ਤੁਸੀਂ ਆਫਲਾਈਨ ਹੋ। ਇੱਥੇ ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ ਵੇਖ ਸਕਦੇ ਹੋ। ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟਾਂ ਲਈ ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ।',
    ],
  'Filter government programmes by category': [
    'सरकारी योजनाएँ श्रेणी के अनुसार छाँटें',
    'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਛਾਂਟੋ',
  ],
  'All programmes': ['सभी योजनाएँ', 'ਸਾਰੀਆਂ ਯੋਜਨਾਵਾਂ'],
  Education: ['शिक्षा', 'ਸਿੱਖਿਆ'],
  'Health & wellbeing': ['स्वास्थ्य और कल्याण', 'ਸਿਹਤ ਅਤੇ ਭਲਾਈ'],
  'Search government programmes': ['सरकारी योजनाएँ खोजें', 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਲੱਭੋ'],
  'Search programmes or topics…': ['योजनाएँ या विषय खोजें…', 'ਯੋਜਨਾਵਾਂ ਜਾਂ ਵਿਸ਼ੇ ਲੱਭੋ…'],
  'Clear programme search': ['योजना की खोज साफ़ करें', 'ਯੋਜਨਾ ਦੀ ਖੋਜ ਸਾਫ਼ ਕਰੋ'],
  '{count} programme to explore': ['देखने के लिए {count} योजना', 'ਵੇਖਣ ਲਈ {count} ਯੋਜਨਾ'],
  '{count} programmes to explore': ['देखने के लिए {count} योजनाएँ', 'ਵੇਖਣ ਲਈ {count} ਯੋਜਨਾਵਾਂ'],
  '{count} programme match your search': [
    'आपकी खोज से {count} योजना मिली',
    'ਤੁਹਾਡੀ ਖੋਜ ਨਾਲ {count} ਯੋਜਨਾ ਮਿਲੀ',
  ],
  '{count} programmes match your search': [
    'आपकी खोज से {count} योजनाएँ मिलीं',
    'ਤੁਹਾਡੀ ਖੋਜ ਨਾਲ {count} ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ',
  ],
  'in {category}': ['{category} में', '{category} ਵਿੱਚ'],
  'Official websites · Internet needed': [
    'आधिकारिक वेबसाइट · इंटरनेट चाहिए',
    'ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟਾਂ · ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ',
  ],
  'No programmes match these filters': [
    'इन फ़िल्टर से कोई योजना नहीं मिली',
    'ਇਨ੍ਹਾਂ ਫ਼ਿਲਟਰਾਂ ਨਾਲ ਕੋਈ ਯੋਜਨਾ ਨਹੀਂ ਮਿਲੀ',
  ],
  'Try a different name or topic, or show all the programmes.': [
    'दूसरा नाम या विषय खोजें, या सभी योजनाएँ देखें।',
    'ਹੋਰ ਨਾਮ ਜਾਂ ਵਿਸ਼ਾ ਲੱਭੋ, ਜਾਂ ਸਾਰੀਆਂ ਯੋਜਨਾਵਾਂ ਵੇਖੋ।',
  ],
  'Clear filters and show all programmes': [
    'फ़िल्टर हटाकर सभी योजनाएँ दिखाएँ',
    'ਫ਼ਿਲਟਰ ਹਟਾ ਕੇ ਸਾਰੀਆਂ ਯੋਜਨਾਵਾਂ ਵਿਖਾਓ',
  ],
  'For {audience}': ['इनके लिए: {audience}', 'ਇਨ੍ਹਾਂ ਲਈ: {audience}'],
  'Official website': ['आधिकारिक वेबसाइट', 'ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ'],
  'Internet needed': ['इंटरनेट चाहिए', 'ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ'],
  'Image source': ['चित्र का स्रोत', 'ਤਸਵੀਰ ਦਾ ਸਰੋਤ'],
  'Usage policy': ['उपयोग नीति', 'ਵਰਤੋਂ ਨੀਤੀ'],
  '{title}: poster unavailable': ['{title}: चित्र उपलब्ध नहीं', '{title}: ਤਸਵੀਰ ਉਪਲਬਧ ਨਹੀਂ'],
  '{title} topics': ['{title} के विषय', '{title} ਦੇ ਵਿਸ਼ੇ'],
  'Open {title} official website. Internet needed. Opens in a new tab.': [
    '{title} की आधिकारिक वेबसाइट खोलें। इंटरनेट चाहिए। नए टैब में खुलेगी।',
    '{title} ਦੀ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹੋ। ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ। ਨਵੀਂ ਟੈਬ ਵਿੱਚ ਖੁੱਲ੍ਹੇਗੀ।',
  ],
  '{title} image source. Opens in a new tab.': [
    '{title} के चित्र का स्रोत। नए टैब में खुलेगा।',
    '{title} ਦੀ ਤਸਵੀਰ ਦਾ ਸਰੋਤ। ਨਵੀਂ ਟੈਬ ਵਿੱਚ ਖੁੱਲ੍ਹੇਗਾ।',
  ],
  '{title} image usage policy. Opens in a new tab.': [
    '{title} के चित्र की उपयोग नीति। नए टैब में खुलेगी।',
    '{title} ਦੀ ਤਸਵੀਰ ਦੀ ਵਰਤੋਂ ਨੀਤੀ। ਨਵੀਂ ਟੈਬ ਵਿੱਚ ਖੁੱਲ੍ਹੇਗੀ।',
  ],
  'Programme details can change. The official website is the source for current services, eligibility and contact information. Bundled images are for reference; the linked websites are not downloaded for offline use.':
    [
      'योजना की जानकारी बदल सकती है। वर्तमान सेवाओं, पात्रता और संपर्क के लिए आधिकारिक वेबसाइट देखें। चित्र संदर्भ के लिए हैं; जुड़ी वेबसाइटें ऑफलाइन उपयोग के लिए डाउनलोड नहीं होतीं।',
      'ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ ਬਦਲ ਸਕਦੀ ਹੈ। ਮੌਜੂਦਾ ਸੇਵਾਵਾਂ, ਯੋਗਤਾ ਅਤੇ ਸੰਪਰਕ ਲਈ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਵੇਖੋ। ਤਸਵੀਰਾਂ ਹਵਾਲੇ ਲਈ ਹਨ; ਜੁੜੀਆਂ ਵੈੱਬਸਾਈਟਾਂ ਆਫਲਾਈਨ ਵਰਤੋਂ ਲਈ ਡਾਊਨਲੋਡ ਨਹੀਂ ਹੁੰਦੀਆਂ।',
    ],
  'Opens in a new tab.': ['नए टैब में खुलेगा।', 'ਨਵੀਂ ਟੈਬ ਵਿੱਚ ਖੁੱਲ੍ਹੇਗਾ।'],
  'Department of School Education & Literacy, Ministry of Education, Government of India': [
    'स्कूल शिक्षा और साक्षरता विभाग, शिक्षा मंत्रालय, भारत सरकार',
    'ਸਕੂਲ ਸਿੱਖਿਆ ਅਤੇ ਸਾਖਰਤਾ ਵਿਭਾਗ, ਸਿੱਖਿਆ ਮੰਤਰਾਲਾ, ਭਾਰਤ ਸਰਕਾਰ',
  ],
  'National Health Mission, Ministry of Health & Family Welfare, Government of India': [
    'राष्ट्रीय स्वास्थ्य मिशन, स्वास्थ्य और परिवार कल्याण मंत्रालय, भारत सरकार',
    'ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਮਿਸ਼ਨ, ਸਿਹਤ ਅਤੇ ਪਰਿਵਾਰ ਭਲਾਈ ਮੰਤਰਾਲਾ, ਭਾਰਤ ਸਰਕਾਰ',
  ],
  'A national digital platform with school learning resources for students and teaching resources for educators.':
    [
      'विद्यार्थियों के लिए स्कूल की पढ़ाई और शिक्षकों के लिए शिक्षण संसाधनों का राष्ट्रीय डिजिटल मंच।',
      'ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਸਕੂਲ ਦੀ ਪੜ੍ਹਾਈ ਅਤੇ ਅਧਿਆਪਕਾਂ ਲਈ ਪੜ੍ਹਾਉਣ ਦੇ ਸਰੋਤਾਂ ਦਾ ਰਾਸ਼ਟਰੀ ਡਿਜੀਟਲ ਮੰਚ।',
    ],
  'An initiative bringing together digital, online and broadcast resources to support learning through multiple channels.':
    [
      'कई माध्यमों से सीखने में मदद के लिए डिजिटल, ऑनलाइन और प्रसारण संसाधनों को एक साथ लाने की पहल।',
      'ਕਈ ਮਾਧਿਅਮਾਂ ਰਾਹੀਂ ਸਿੱਖਣ ਵਿੱਚ ਮਦਦ ਲਈ ਡਿਜੀਟਲ, ਆਨਲਾਈਨ ਅਤੇ ਪ੍ਰਸਾਰਣ ਸਰੋਤਾਂ ਨੂੰ ਇਕੱਠੇ ਲਿਆਉਣ ਦੀ ਪਹਿਲ।',
    ],
  'A national mission focused on foundational reading, writing and numeracy in the early school years.': [
    'शुरुआती कक्षाओं में बुनियादी पढ़ने, लिखने और गणित पर केंद्रित राष्ट्रीय मिशन।',
    'ਸ਼ੁਰੂਆਤੀ ਜਮਾਤਾਂ ਵਿੱਚ ਬੁਨਿਆਦੀ ਪੜ੍ਹਨ, ਲਿਖਣ ਅਤੇ ਗਣਿਤ ਉੱਤੇ ਕੇਂਦਰਿਤ ਰਾਸ਼ਟਰੀ ਮਿਸ਼ਨ।',
  ],
  'An integrated school-education scheme spanning pre-school through Class 12.': [
    'प्री-स्कूल से कक्षा 12 तक की एकीकृत स्कूल शिक्षा योजना।',
    'ਪ੍ਰੀ-ਸਕੂਲ ਤੋਂ ਜਮਾਤ 12 ਤੱਕ ਦੀ ਏਕੀਕ੍ਰਿਤ ਸਕੂਲ ਸਿੱਖਿਆ ਯੋਜਨਾ।',
  ],
  'An initiative for strengthening existing schools through the PM Schools for Rising India programme.': [
    'पीएम स्कूल्स फॉर राइजिंग इंडिया कार्यक्रम के माध्यम से मौजूदा स्कूलों को मज़बूत करने की पहल।',
    'ਪੀਐੱਮ ਸਕੂਲਜ਼ ਫਾਰ ਰਾਈਜ਼ਿੰਗ ਇੰਡੀਆ ਪ੍ਰੋਗਰਾਮ ਰਾਹੀਂ ਮੌਜੂਦਾ ਸਕੂਲਾਂ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਨ ਦੀ ਪਹਿਲ।',
  ],
  'Official information about the school-meal programme supporting nutrition and participation in education.':
    [
      'पोषण और शिक्षा में भागीदारी को बढ़ावा देने वाले स्कूल भोजन कार्यक्रम की आधिकारिक जानकारी।',
      'ਪੋਸ਼ਣ ਅਤੇ ਸਿੱਖਿਆ ਵਿੱਚ ਭਾਗੀਦਾਰੀ ਨੂੰ ਉਤਸ਼ਾਹਿਤ ਕਰਨ ਵਾਲੇ ਸਕੂਲ ਭੋਜਨ ਪ੍ਰੋਗਰਾਮ ਦੀ ਅਧਿਕਾਰਤ ਜਾਣਕਾਰੀ।',
    ],
  'Explore the National Health Mission’s child-health programme information and resources for families and community teams.':
    [
      'परिवारों और सामुदायिक टीमों के लिए राष्ट्रीय स्वास्थ्य मिशन के बाल स्वास्थ्य कार्यक्रम की जानकारी और संसाधन देखें।',
      'ਪਰਿਵਾਰਾਂ ਅਤੇ ਭਾਈਚਾਰਕ ਟੀਮਾਂ ਲਈ ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਮਿਸ਼ਨ ਦੇ ਬਾਲ ਸਿਹਤ ਪ੍ਰੋਗਰਾਮ ਦੀ ਜਾਣਕਾਰੀ ਅਤੇ ਸਰੋਤ ਵੇਖੋ।',
    ],
  'Official adolescent-health information, educational materials and programme resources from the National Health Mission.':
    [
      'राष्ट्रीय स्वास्थ्य मिशन की आधिकारिक किशोर स्वास्थ्य जानकारी, शिक्षण सामग्री और कार्यक्रम संसाधन।',
      'ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਮਿਸ਼ਨ ਦੀ ਅਧਿਕਾਰਤ ਕਿਸ਼ੋਰ ਸਿਹਤ ਜਾਣਕਾਰੀ, ਸਿੱਖਿਆ ਸਮੱਗਰੀ ਅਤੇ ਪ੍ਰੋਗਰਾਮ ਸਰੋਤ।',
    ],
  'Students, teachers and families': ['विद्यार्थी, शिक्षक और परिवार', 'ਵਿਦਿਆਰਥੀ, ਅਧਿਆਪਕ ਅਤੇ ਪਰਿਵਾਰ'],
  'Early-grade teachers and families': [
    'शुरुआती कक्षाओं के शिक्षक और परिवार',
    'ਸ਼ੁਰੂਆਤੀ ਜਮਾਤਾਂ ਦੇ ਅਧਿਆਪਕ ਅਤੇ ਪਰਿਵਾਰ',
  ],
  'Teachers, school teams and families': [
    'शिक्षक, स्कूल की टीमें और परिवार',
    'ਅਧਿਆਪਕ, ਸਕੂਲ ਦੀਆਂ ਟੀਮਾਂ ਅਤੇ ਪਰਿਵਾਰ',
  ],
  'School teams and families': ['स्कूल की टीमें और परिवार', 'ਸਕੂਲ ਦੀਆਂ ਟੀਮਾਂ ਅਤੇ ਪਰਿਵਾਰ'],
  'Families, educators and community health workers': [
    'परिवार, शिक्षक और सामुदायिक स्वास्थ्य कार्यकर्ता',
    'ਪਰਿਵਾਰ, ਅਧਿਆਪਕ ਅਤੇ ਭਾਈਚਾਰਕ ਸਿਹਤ ਕਰਮਚਾਰੀ',
  ],
  'Adolescents, families, educators and community workers': [
    'किशोर, परिवार, शिक्षक और सामुदायिक कार्यकर्ता',
    'ਕਿਸ਼ੋਰ, ਪਰਿਵਾਰ, ਅਧਿਆਪਕ ਅਤੇ ਭਾਈਚਾਰਕ ਕਰਮਚਾਰੀ',
  ],
  'School learning': ['स्कूल की पढ़ाई', 'ਸਕੂਲ ਦੀ ਪੜ੍ਹਾਈ'],
  'Digital resources': ['डिजिटल संसाधन', 'ਡਿਜੀਟਲ ਸਰੋਤ'],
  Teaching: ['शिक्षण', 'ਪੜ੍ਹਾਉਣਾ'],
  'Digital learning': ['डिजिटल शिक्षा', 'ਡਿਜੀਟਲ ਸਿੱਖਿਆ'],
  'TV and radio': ['टीवी और रेडियो', 'ਟੀਵੀ ਅਤੇ ਰੇਡੀਓ'],
  'Learning access': ['शिक्षा तक पहुँच', 'ਸਿੱਖਿਆ ਤੱਕ ਪਹੁੰਚ'],
  'Foundational learning': ['बुनियादी शिक्षा', 'ਬੁਨਿਆਦੀ ਸਿੱਖਿਆ'],
  Numeracy: ['गणित की बुनियाद', 'ਗਣਿਤ ਦੀ ਬੁਨਿਆਦ'],
  'School education': ['स्कूली शिक्षा', 'ਸਕੂਲੀ ਸਿੱਖਿਆ'],
  Inclusion: ['समावेशन', 'ਸ਼ਮੂਲੀਅਤ'],
  'School development': ['स्कूल विकास', 'ਸਕੂਲ ਵਿਕਾਸ'],
  'Learning environment': ['सीखने का माहौल', 'ਸਿੱਖਣ ਦਾ ਮਾਹੌਲ'],
  Schools: ['स्कूल', 'ਸਕੂਲ'],
  'School meals': ['स्कूल भोजन', 'ਸਕੂਲ ਭੋਜਨ'],
  Nutrition: ['पोषण', 'ਪੋਸ਼ਣ'],
  'School participation': ['स्कूल में भागीदारी', 'ਸਕੂਲ ਵਿੱਚ ਭਾਗੀਦਾਰੀ'],
  'Child health': ['बाल स्वास्थ्य', 'ਬਾਲ ਸਿਹਤ'],
  'Community care': ['सामुदायिक देखभाल', 'ਭਾਈਚਾਰਕ ਦੇਖਭਾਲ'],
  'Family resources': ['परिवार के संसाधन', 'ਪਰਿਵਾਰ ਦੇ ਸਰੋਤ'],
  'Adolescent wellbeing': ['किशोर कल्याण', 'ਕਿਸ਼ੋਰ ਭਲਾਈ'],
  'Health education': ['स्वास्थ्य शिक्षा', 'ਸਿਹਤ ਸਿੱਖਿਆ'],
  'Community support': ['सामुदायिक सहयोग', 'ਭਾਈਚਾਰਕ ਸਹਿਯੋਗ'],
  'Rashtriya Bal Swasthya Karyakram': ['राष्ट्रीय बाल स्वास्थ्य कार्यक्रम', 'ਰਾਸ਼ਟਰੀ ਬਾਲ ਸਵਾਸਥ ਕਾਰਯਕ੍ਰਮ'],
  'Rashtriya Kishor Swasthya Karyakram': [
    'राष्ट्रीय किशोर स्वास्थ्य कार्यक्रम',
    'ਰਾਸ਼ਟਰੀ ਕਿਸ਼ੋਰ ਸਵਾਸਥ ਕਾਰਯਕ੍ਰਮ',
  ],
  'Official DIKSHA education resource banner': [
    'आधिकारिक DIKSHA शिक्षा संसाधन बैनर',
    'ਅਧਿਕਾਰਤ DIKSHA ਸਿੱਖਿਆ ਸਰੋਤ ਬੈਨਰ',
  ],
  'Official PM e-VIDYA education programme banner': [
    'आधिकारिक PM e-VIDYA शिक्षा कार्यक्रम बैनर',
    'ਅਧਿਕਾਰਤ PM e-VIDYA ਸਿੱਖਿਆ ਪ੍ਰੋਗਰਾਮ ਬੈਨਰ',
  ],
  'Official NIPUN Bharat foundational literacy and numeracy banner': [
    'आधिकारिक NIPUN Bharat बुनियादी साक्षरता और गणित बैनर',
    'ਅਧਿਕਾਰਤ NIPUN Bharat ਬੁਨਿਆਦੀ ਸਾਖਰਤਾ ਅਤੇ ਗਣਿਤ ਬੈਨਰ',
  ],
  'Official Samagra Shiksha school education programme banner': [
    'आधिकारिक Samagra Shiksha स्कूल शिक्षा कार्यक्रम बैनर',
    'ਅਧਿਕਾਰਤ Samagra Shiksha ਸਕੂਲ ਸਿੱਖਿਆ ਪ੍ਰੋਗਰਾਮ ਬੈਨਰ',
  ],
  'Official PM SHRI Schools programme banner': [
    'आधिकारिक PM SHRI Schools कार्यक्रम बैनर',
    'ਅਧਿਕਾਰਤ PM SHRI Schools ਪ੍ਰੋਗਰਾਮ ਬੈਨਰ',
  ],
  'Official PM POSHAN school-meal programme banner': [
    'आधिकारिक PM POSHAN स्कूल भोजन कार्यक्रम बैनर',
    'ਅਧਿਕਾਰਤ PM POSHAN ਸਕੂਲ ਭੋਜਨ ਪ੍ਰੋਗਰਾਮ ਬੈਨਰ',
  ],
  'Official National Health Mission photograph for its child-health programme': [
    'राष्ट्रीय स्वास्थ्य मिशन के बाल स्वास्थ्य कार्यक्रम का आधिकारिक चित्र',
    'ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਮਿਸ਼ਨ ਦੇ ਬਾਲ ਸਿਹਤ ਪ੍ਰੋਗਰਾਮ ਦੀ ਅਧਿਕਾਰਤ ਤਸਵੀਰ',
  ],
  'Official National Health Mission photograph for its adolescent-health programme': [
    'राष्ट्रीय स्वास्थ्य मिशन के किशोर स्वास्थ्य कार्यक्रम का आधिकारिक चित्र',
    'ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਮਿਸ਼ਨ ਦੇ ਕਿਸ਼ੋਰ ਸਿਹਤ ਪ੍ਰੋਗਰਾਮ ਦੀ ਅਧਿਕਾਰਤ ਤਸਵੀਰ',
  ],
};
