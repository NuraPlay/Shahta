{"jwk":{"crv":"P-256","d":"tMpkQsIHaQDKaK1rHcYdNLLr43QHkIR4bos1J7mPMnY","ext":true,"key_ops":["sign"],"kty":"EC","x":"YHxJIADl5R_aF8bvj5wgXgbRkkoAl58KK-ECNAQDvQM","y":"fvIFg2trzpCbHFpHOT1InjaVXAXo5JIa7b74u1MdKr0"},"pub":"BGB8SSAA5eUf2hfG74-cIF4G0ZJKAJefCivhAjQEA70DfvIFg2trzpCbHFpHOT1InjaVXAXo5JIa7b74u1MdKr0"}
/* Настройки донатов. Заполни своими данными и загрузи на сайт рядом с donate.html.
   Пока pub и хотя бы один банк пустые, на странице донатов будет надпись «скоро». */
window.PAYCFG={
  auto:false,                 // true = автоматическая оплата через Kaspi (нужны api/donate.js, lib/provider.js и ключи в Vercel)
  kaspi:{phone:'4400430342083364',name:'Nurzat S'},   // Kaspi: номер телефона и имя получателя, например '+7 701 123 45 67' и 'Айдос К.'
  halyk:{card:'4003035103259805',name:'Nurzat S'},    // Halyk Bank: номер карты и имя, например '4400 1234 5678 9012' и 'Айдос К.'
  tg:'Nurekenge',                      // Telegram без @, например 'aidos_games'
  wa:'',                      // WhatsApp, только цифры, например '77011234567' (можно оставить пустым)
  pub:'BGB8SSAA5eUf2hfG74-cIF4G0ZJKAJefCivhAjQEA70DfvIFg2trzpCbHFpHOT1InjaVXAXo5JIa7b74u1MdKr0',                     // публичный ключ: создаётся на donate.html#admin (см. инструкцию)
  rate:3,                     // для любой суммы: 1 ₸ = 3 золота
  packs:[                     // [сумма в ₸, золото, значок]
    [500,1500,'☕'],
    [1000,3500,'🍔'],
    [2500,10000,'🎁'],
    [5000,24000,'💎'],
    [10000,55000,'👑']
  ]
};
