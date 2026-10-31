// Technical event logs retain their original English and exact values.
export const labTranslations: Record<string, readonly [string, string]> = {
  Yes: ['हाँ', 'ਹਾਂ'],
  No: ['नहीं', 'ਨਹੀਂ'],
  'THE RESILIENCE LAB / REAL EXECUTIONS': [
    'सहनशीलता प्रयोगशाला / वास्तविक परीक्षण',
    'ਸਹਿਣਸ਼ੀਲਤਾ ਪ੍ਰਯੋਗਸ਼ਾਲਾ / ਅਸਲ ਪਰਖਾਂ',
  ],
  'Go ahead. Pull the plug.': ['कनेक्शन तोड़कर जाँचें।', 'ਕਨੈਕਸ਼ਨ ਤੋੜ ਕੇ ਜਾਂਚੋ।'],
  'Two independent encrypted devices. One real SQLite hub. Every claim, inspectable.': [
    'दो स्वतंत्र एन्क्रिप्टेड डिवाइस। एक वास्तविक SQLite हब। हर नतीजे की जाँच करें।',
    'ਦੋ ਸੁਤੰਤਰ ਇਨਕ੍ਰਿਪਟਡ ਡਿਵਾਈਸ। ਇੱਕ ਅਸਲ SQLite ਹੱਬ। ਹਰ ਨਤੀਜਾ ਜਾਂਚੋ।',
  ],
  'Developer & judge tools': ['डेवलपर और निर्णायक के उपकरण', 'ਡਿਵੈਲਪਰ ਅਤੇ ਜੱਜ ਦੇ ਸੰਦ'],
  'This lab creates synthetic records in the real hub. Link profiles add a delay between actual HTTP batches; the chaos benchmark separately simulates packet loss and reordering.':
    [
      'यह प्रयोगशाला वास्तविक हब में काल्पनिक रिकॉर्ड बनाती है। कनेक्शन प्रोफ़ाइल HTTP बैचों के बीच देरी जोड़ती हैं; अराजकता परीक्षण अलग से पैकेट खोने और क्रम बदलने का अनुकरण करता है।',
      'ਇਹ ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਅਸਲ ਹੱਬ ਵਿੱਚ ਕਾਲਪਨਿਕ ਰਿਕਾਰਡ ਬਣਾਉਂਦੀ ਹੈ। ਕਨੈਕਸ਼ਨ ਪ੍ਰੋਫ਼ਾਈਲਾਂ HTTP ਬੈਚਾਂ ਵਿਚਕਾਰ ਦੇਰੀ ਜੋੜਦੀਆਂ ਹਨ; ਅਰਾਜਕਤਾ ਪਰਖ ਵੱਖਰੇ ਤੌਰ ਉੱਤੇ ਪੈਕਟ ਗੁੰਮਣ ਅਤੇ ਕ੍ਰਮ ਬਦਲਣ ਦੀ ਨਕਲ ਕਰਦੀ ਹੈ।',
    ],
  'Make the network misbehave': ['खराब नेटवर्क में जाँच करें', 'ਖ਼ਰਾਬ ਨੈੱਟਵਰਕ ਵਿੱਚ ਜਾਂਚ ਕਰੋ'],
  'Provision two independent demo devices, then choose which stories to change.': [
    'दो स्वतंत्र डेमो डिवाइस तैयार करें, फिर बदलने वाली जानकारी चुनें।',
    'ਦੋ ਸੁਤੰਤਰ ਡੈਮੋ ਡਿਵਾਈਸ ਤਿਆਰ ਕਰੋ, ਫਿਰ ਬਦਲਣ ਵਾਲੀ ਜਾਣਕਾਰੀ ਚੁਣੋ।',
  ],
  'Provisioning devices…': ['डिवाइस तैयार हो रहे हैं…', 'ਡਿਵਾਈਸ ਤਿਆਰ ਹੋ ਰਹੇ ਹਨ…'],
  'Initialize two real devices': ['दो वास्तविक डिवाइस तैयार करें', 'ਦੋ ਅਸਲ ਡਿਵਾਈਸ ਤਿਆਰ ਕਰੋ'],
  'Link profile': ['कनेक्शन का प्रकार', 'ਕਨੈਕਸ਼ਨ ਦੀ ਕਿਸਮ'],
  Good: ['अच्छा', 'ਵਧੀਆ'],
  Flaky: ['अस्थिर', 'ਅਸਥਿਰ'],
  '2G': ['2G', '2G'],
  'Create concurrent scenario': ['एक साथ बदलाव का परीक्षण बनाएँ', 'ਇੱਕੋ ਸਮੇਂ ਤਬਦੀਲੀਆਂ ਦੀ ਪਰਖ ਬਣਾਓ'],
  'Reconnect & sync': ['दोबारा जुड़ें और सिंक करें', 'ਮੁੜ ਜੁੜੋ ਅਤੇ ਸਿੰਕ ਕਰੋ'],
  'Kill transfer': ['स्थानांतरण रोकें', 'ਤਬਾਦਲਾ ਰੋਕੋ'],
  'Lose the next acknowledgement after the hub commits (real fault injection)': [
    'हब पर सहेजने के बाद अगली पुष्टि खोने का परीक्षण करें (वास्तविक त्रुटि परीक्षण)',
    'ਹੱਬ ਉੱਤੇ ਸੰਭਾਲਣ ਤੋਂ ਬਾਅਦ ਅਗਲੀ ਪੁਸ਼ਟੀ ਗੁੰਮਣ ਦੀ ਪਰਖ ਕਰੋ (ਅਸਲ ਤਰੁੱਟੀ ਪਰਖ)',
  ],
  'Device B · Teacher': ['डिवाइस B · शिक्षक', 'ਡਿਵਾਈਸ B · ਅਧਿਆਪਕ'],
  'Device A · Health worker': ['डिवाइस A · स्वास्थ्य कार्यकर्ता', 'ਡਿਵਾਈਸ A · ਸਿਹਤ ਕਰਮਚਾਰੀ'],
  'Separate IndexedDB ·': ['अलग IndexedDB ·', 'ਵੱਖਰੀ IndexedDB ·'],
  'Child date of birth': ['बच्चे की जन्म तिथि', 'ਬੱਚੇ ਦੀ ਜਨਮ ਮਿਤੀ'],
  'Device {device} date of birth': ['डिवाइस {device} पर जन्म तिथि', 'ਡਿਵਾਈਸ {device} ਉੱਤੇ ਜਨਮ ਮਿਤੀ'],
  'Save offline on Device': ['इस डिवाइस पर ऑफलाइन सहेजें:', 'ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਆਫਲਾਈਨ ਸੰਭਾਲੋ:'],
  'Local operations': ['स्थानीय प्रविष्टियाँ', 'ਸਥਾਨਕ ਐਂਟਰੀਆਂ'],
  'Pending upload': ['अपलोड बाकी', 'ਅੱਪਲੋਡ ਬਾਕੀ'],
  'Durable pull cursor': ['सुरक्षित प्राप्ति कर्सर', 'ਸੁਰੱਖਿਅਤ ਪ੍ਰਾਪਤੀ ਕਰਸਰ'],
  'CANONICAL LOG DIGEST': ['मानक लॉग डाइजेस्ट', 'ਮਿਆਰੀ ਲੌਗ ਡਾਈਜੈਸਟ'],
  'Computing…': ['गणना जारी है…', 'ਗਣਨਾ ਜਾਰੀ ਹੈ…'],
  'Zero-loss ledger · measured evidence': [
    'बिना हानि का रजिस्टर · मापे गए प्रमाण',
    'ਬਿਨਾਂ ਨੁਕਸਾਨ ਦਾ ਰਜਿਸਟਰ · ਮਾਪੇ ਸਬੂਤ',
  ],
  'Replicas agree': ['प्रतियों में समानता है', 'ਕਾਪੀਆਂ ਇੱਕੋ ਜਿਹੀਆਂ ਹਨ'],
  'Replicas differ': ['प्रतियों में अंतर है', 'ਕਾਪੀਆਂ ਵਿੱਚ ਫ਼ਰਕ ਹੈ'],
  'Lab operations created': ['परीक्षण की बनी प्रविष्टियाँ', 'ਪਰਖ ਦੀਆਂ ਬਣੀਆਂ ਐਂਟਰੀਆਂ'],
  'Confirmed at hub*': ['हब पर पुष्टि हुई*', 'ਹੱਬ ਉੱਤੇ ਪੁਸ਼ਟੀ ਹੋਈ*'],
  'Preserved in conflict': ['विरोध में सुरक्षित', 'ਵਿਰੋਧ ਵਿੱਚ ਸੁਰੱਖਿਅਤ'],
  'Missing from local logs': ['स्थानीय लॉग से गायब', 'ਸਥਾਨਕ ਲੌਗ ਤੋਂ ਗੁੰਮ'],
  '*Hub count is refreshed after a complete reconnect. The local missing-operation check covers the logs currently available, not destroyed or unknown devices. It is not a universal zero-loss guarantee.':
    [
      '*पूरा दोबारा जुड़ने के बाद हब की गिनती अपडेट होती है। गायब प्रविष्टियों की जाँच अभी उपलब्ध लॉग तक सीमित है; नष्ट या अज्ञात डिवाइस इसमें नहीं हैं। यह हर स्थिति में शून्य हानि की गारंटी नहीं है।',
      '*ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁੜ ਜੁੜਨ ਤੋਂ ਬਾਅਦ ਹੱਬ ਦੀ ਗਿਣਤੀ ਅੱਪਡੇਟ ਹੁੰਦੀ ਹੈ। ਗੁੰਮ ਐਂਟਰੀਆਂ ਦੀ ਜਾਂਚ ਹੁਣ ਉਪਲਬਧ ਲੌਗ ਤੱਕ ਸੀਮਿਤ ਹੈ; ਨਸ਼ਟ ਜਾਂ ਅਣਜਾਣ ਡਿਵਾਈਸ ਇਸ ਵਿੱਚ ਨਹੀਂ ਹਨ। ਇਹ ਹਰ ਹਾਲਤ ਵਿੱਚ ਸਿਫ਼ਰ ਨੁਕਸਾਨ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ।',
    ],
  'Two dates. Both kept.': ['दो तिथियाँ। दोनों सुरक्षित।', 'ਦੋ ਮਿਤੀਆਂ। ਦੋਵੇਂ ਸੁਰੱਖਿਅਤ।'],
  Confirm: ['पुष्टि करें:', 'ਪੁਸ਼ਟੀ ਕਰੋ:'],
  'Lost phone drill (lab device A)': ['फोन खोने का परीक्षण (डिवाइस A)', 'ਫ਼ੋਨ ਗੁੰਮਣ ਦੀ ਪਰਖ (ਡਿਵਾਈਸ A)'],
  'Export evidence': ['प्रमाण डाउनलोड करें', 'ਸਬੂਤ ਡਾਊਨਲੋਡ ਕਰੋ'],
  'A benchmark you can rerun': ['फिर से चलाने योग्य परीक्षण', 'ਮੁੜ ਚਲਾਉਣਯੋਗ ਪਰਖ'],
  'Deterministic in-process chaos · 8 devices': [
    'निश्चित प्रक्रिया का अराजकता परीक्षण · 8 डिवाइस',
    'ਨਿਸ਼ਚਿਤ ਪ੍ਰਕਿਰਿਆ ਦੀ ਅਰਾਜਕਤਾ ਪਰਖ · 8 ਡਿਵਾਈਸ',
  ],
  '240 operations. 60% simulated packet loss. Duplicate replay and reordered messages. Twelve lossy rounds, followed by an explicit final reconnect.':
    [
      '240 प्रविष्टियाँ। 60% पैकेट हानि का अनुकरण। संदेशों का दोहराव और बदला क्रम। हानि वाले बारह दौर, फिर अंतिम बार पूरा कनेक्शन।',
      '240 ਐਂਟਰੀਆਂ। 60% ਪੈਕਟ ਨੁਕਸਾਨ ਦੀ ਨਕਲ। ਸੁਨੇਹਿਆਂ ਦਾ ਦੁਹਰਾਅ ਅਤੇ ਬਦਲਿਆ ਕ੍ਰਮ। ਨੁਕਸਾਨ ਵਾਲੇ ਬਾਰਾਂ ਦੌਰ, ਫਿਰ ਆਖ਼ਰੀ ਵਾਰ ਪੂਰਾ ਕਨੈਕਸ਼ਨ।',
    ],
  Seed: ['सीड', 'ਸੀਡ'],
  'Chaos seed': ['परीक्षण सीड', 'ਪਰਖ ਸੀਡ'],
  'Run chaos benchmark': ['अराजकता परीक्षण चलाएँ', 'ਅਰਾਜਕਤਾ ਪਰਖ ਚਲਾਓ'],
  METHOD: ['विधि', 'ਵਿਧੀ'],
  'ACCEPTED OPS': ['स्वीकृत प्रविष्टियाँ', 'ਮੰਨੀਆਂ ਐਂਟਰੀਆਂ'],
  'LOST OPS': ['खोई प्रविष्टियाँ', 'ਗੁੰਮ ਐਂਟਰੀਆਂ'],
  'DUPLICATE EFFECTS': ['दोहराव का प्रभाव', 'ਦੁਹਰਾਅ ਦਾ ਅਸਰ'],
  CONVERGED: ['समान परिणाम', 'ਇੱਕੋ ਜਿਹਾ ਨਤੀਜਾ'],
  'Whole-field wall-clock LWW discarded': [
    'समय-आधारित पूरे खाने के LWW ने हटाए:',
    'ਸਮਾਂ-ਆਧਾਰਿਤ ਪੂਰੇ ਖਾਨੇ ਦੇ LWW ਨੇ ਹਟਾਏ:',
  ],
  'independent append-only events in this same operation set. Baseline measures event loss; it does not compare full historical operation logs.':
    [
      'स्वतंत्र केवल-जोड़ने वाले इवेंट, इसी प्रविष्टि समूह में। आधार परीक्षण इवेंट हानि मापता है; पूरे ऐतिहासिक लॉग की तुलना नहीं करता।',
      'ਸੁਤੰਤਰ ਕੇਵਲ-ਜੋੜਨ ਵਾਲੇ ਇਵੈਂਟ, ਇਸੇ ਐਂਟਰੀ ਸਮੂਹ ਵਿੱਚ। ਆਧਾਰ ਪਰਖ ਇਵੈਂਟ ਨੁਕਸਾਨ ਮਾਪਦੀ ਹੈ; ਪੂਰੇ ਇਤਿਹਾਸਕ ਲੌਗ ਦੀ ਤੁਲਨਾ ਨਹੀਂ ਕਰਦੀ।',
    ],
  'CPU time:': ['CPU समय:', 'CPU ਸਮਾਂ:'],
  'ms · JSON deltas:': ['मिलीसेकंड · JSON अंतर:', 'ਮਿਲੀਸਕਿੰਟ · JSON ਫ਼ਰਕ:'],
  'dropped deliveries. These are simulator measurements, not measured 2G network latency.': [
    'वितरण खोए। ये सिम्युलेटर के माप हैं, वास्तविक 2G नेटवर्क की देरी के माप नहीं।',
    'ਡਿਲਿਵਰੀਆਂ ਗੁੰਮੀਆਂ। ਇਹ ਸਿਮੂਲੇਟਰ ਦੇ ਮਾਪ ਹਨ, ਅਸਲ 2G ਨੈੱਟਵਰਕ ਦੀ ਦੇਰੀ ਦੇ ਮਾਪ ਨਹੀਂ।',
  ],
  'The live flight recorder': ['परीक्षण का लाइव लॉग', 'ਪਰਖ ਦਾ ਲਾਈਵ ਲੌਗ'],
  'Most recent first': ['सबसे नया पहले', 'ਸਭ ਤੋਂ ਨਵਾਂ ਪਹਿਲਾਂ'],
  'Initialize the devices or run a benchmark to begin collecting evidence.': [
    'प्रमाण एकत्र करने के लिए डिवाइस तैयार करें या परीक्षण चलाएँ।',
    'ਸਬੂਤ ਇਕੱਠੇ ਕਰਨ ਲਈ ਡਿਵਾਈਸ ਤਿਆਰ ਕਰੋ ਜਾਂ ਪਰਖ ਚਲਾਓ।',
  ],
  'Lab synchronization complete. Inspect the measured ledger.': [
    'प्रयोगशाला सिंक पूरा। मापा गया रजिस्टर देखें।',
    'ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਸਿੰਕ ਪੂਰਾ। ਮਾਪਿਆ ਰਜਿਸਟਰ ਵੇਖੋ।',
  ],
  'The lab link is offline. Select Good, 2G, or Flaky to reconnect.': [
    'परीक्षण कनेक्शन ऑफलाइन है। दोबारा जुड़ने के लिए अच्छा, 2G या अस्थिर चुनें।',
    'ਪਰਖ ਕਨੈਕਸ਼ਨ ਆਫਲਾਈਨ ਹੈ। ਮੁੜ ਜੁੜਨ ਲਈ ਵਧੀਆ, 2G ਜਾਂ ਅਸਥਿਰ ਚੁਣੋ।',
  ],
  'Transfer interrupted. Committed cursor retained.': [
    'स्थानांतरण रुक गया। सहेजा गया कर्सर सुरक्षित है।',
    'ਤਬਾਦਲਾ ਰੁਕ ਗਿਆ। ਸੰਭਾਲਿਆ ਕਰਸਰ ਸੁਰੱਖਿਅਤ ਹੈ।',
  ],
  'Sync Device A first. Unsynchronized operations would be lost without a backup.': [
    'पहले डिवाइस A सिंक करें। बैकअप के बिना असिंक प्रविष्टियाँ खो जाएँगी।',
    'ਪਹਿਲਾਂ ਡਿਵਾਈਸ A ਸਿੰਕ ਕਰੋ। ਬੈਕਅੱਪ ਤੋਂ ਬਿਨਾਂ ਬਿਨਾਂ-ਸਿੰਕ ਐਂਟਰੀਆਂ ਗੁੰਮ ਜਾਣਗੀਆਂ।',
  ],
};
