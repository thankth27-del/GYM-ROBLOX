const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;
const dbPath = path.join(__dirname, 'database', 'gym_roblox.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
  CREATE TABLE IF NOT EXISTS MEMBER (
    MEMBER_ID CHAR(5) NOT NULL UNIQUE,
    MEMBER_NAME VARCHAR(50) NOT NULL, MEMBER_HOUSE_NO VARCHAR(10), MEMBER_STREET VARCHAR(50),
    MEMBER_SUBDISTRICT VARCHAR(50), MEMBER_DISTRICT VARCHAR(50), MEMBER_PROVINCE VARCHAR(50),
    MEMBER_POSTCODE CHAR(5), BIRTH_DATE DATE NOT NULL, GENDER VARCHAR(10),
    MEMBER_SINCE_DATE DATE NOT NULL, ROBUX_BALANCE INT NOT NULL DEFAULT 0,
    PRIMARY KEY (MEMBER_ID)
  );
  CREATE TABLE IF NOT EXISTS TRAINER (
    TRAINER_ID CHAR(5) NOT NULL UNIQUE, TRAINER_NAME VARCHAR(50) NOT NULL,
    SPECIALTY VARCHAR(50) NOT NULL, TRAINER_PHONE CHAR(10) NOT NULL,
    PRIMARY KEY (TRAINER_ID)
  );
  CREATE TABLE IF NOT EXISTS MEMBERSHIP_PLAN (
    PLAN_ID CHAR(5) NOT NULL UNIQUE, PLAN_NAME VARCHAR(50) NOT NULL,
    DURATION_MONTHS INT NOT NULL, PRICE DECIMAL(8,2) NOT NULL, PRIMARY KEY (PLAN_ID)
  );
  CREATE TABLE IF NOT EXISTS CLASS (
    CLASS_ID CHAR(5) NOT NULL UNIQUE, CLASS_NAME VARCHAR(50) NOT NULL, TRAINER_ID CHAR(5) NOT NULL,
    CLASS_CAPACITY INT NOT NULL, CLASS_SCHEDULE VARCHAR(50) NOT NULL, PRIMARY KEY (CLASS_ID),
    FOREIGN KEY (TRAINER_ID) REFERENCES TRAINER(TRAINER_ID)
  );
  CREATE TABLE IF NOT EXISTS LOCKER (
    LOCKER_ID CHAR(5) NOT NULL UNIQUE, LOCKER_NUMBER VARCHAR(10) NOT NULL, MEMBER_ID CHAR(5) UNIQUE,
    PRIMARY KEY (LOCKER_ID),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS SUBSCRIPTION (
    SUBSCRIPTION_ID CHAR(6) NOT NULL UNIQUE, MEMBER_ID CHAR(5) NOT NULL, PLAN_ID CHAR(5) NOT NULL,
    START_DATE DATE NOT NULL, SUBSCRIPTION_END_DATE DATE NOT NULL, PRIMARY KEY (SUBSCRIPTION_ID),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID),
    FOREIGN KEY (PLAN_ID) REFERENCES MEMBERSHIP_PLAN(PLAN_ID)
  );
  CREATE TABLE IF NOT EXISTS PAYMENT (
    PAYMENT_ID CHAR(6) NOT NULL UNIQUE, SUBSCRIPTION_ID CHAR(6) NOT NULL UNIQUE, PAYMENT_METHOD VARCHAR(20) NOT NULL,
    PAYMENT_AMOUNT DECIMAL(8,2) NOT NULL, PAYMENT_STATUS VARCHAR(20) NOT NULL DEFAULT 'รอชำระ', PAYMENT_DATE DATE,
    PRIMARY KEY (PAYMENT_ID),
    FOREIGN KEY (SUBSCRIPTION_ID) REFERENCES SUBSCRIPTION(SUBSCRIPTION_ID)
  );
  CREATE TABLE IF NOT EXISTS ENROLLMENT (
    MEMBER_ID CHAR(5) NOT NULL, CLASS_ID CHAR(5) NOT NULL, ENROLL_DATE DATE NOT NULL,
    PRIMARY KEY (MEMBER_ID, CLASS_ID),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID),
    FOREIGN KEY (CLASS_ID) REFERENCES CLASS(CLASS_ID)
  );
  CREATE TABLE IF NOT EXISTS MEMBER_PHONE (
    MEMBER_ID CHAR(5) NOT NULL, PHONE_NUMBER CHAR(10) NOT NULL,
    PRIMARY KEY (MEMBER_ID, PHONE_NUMBER),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID)
  );
  CREATE TABLE IF NOT EXISTS CLASS_TAG (
    CLASS_ID CHAR(5) NOT NULL, TAG_NAME VARCHAR(20) NOT NULL,
    PRIMARY KEY (CLASS_ID, TAG_NAME),
    FOREIGN KEY (CLASS_ID) REFERENCES CLASS(CLASS_ID)
  );
  CREATE TABLE IF NOT EXISTS POINT_TRANSACTION (
    POINT_TX_ID CHAR(6) NOT NULL UNIQUE, MEMBER_ID CHAR(5) NOT NULL, TX_TYPE VARCHAR(10) NOT NULL,
    POINT_AMOUNT INT NOT NULL, TX_DATE DATE NOT NULL, TX_REASON VARCHAR(50), PRIMARY KEY (POINT_TX_ID),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID)
  );
`);

function seedDatabase() {
  const hasMembers = db.prepare('SELECT COUNT(*) AS total FROM MEMBER').get().total;
  if (hasMembers > 0) return;

  const insertMember = db.prepare(`INSERT INTO MEMBER
    (MEMBER_ID, MEMBER_NAME, MEMBER_HOUSE_NO, MEMBER_STREET, MEMBER_SUBDISTRICT,
     MEMBER_DISTRICT, MEMBER_PROVINCE, MEMBER_POSTCODE, BIRTH_DATE, GENDER,
     MEMBER_SINCE_DATE, ROBUX_BALANCE)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTrainer = db.prepare('INSERT INTO TRAINER VALUES (?, ?, ?, ?)');
  const insertPlan = db.prepare('INSERT INTO MEMBERSHIP_PLAN VALUES (?, ?, ?, ?)');
  const insertClass = db.prepare('INSERT INTO CLASS VALUES (?, ?, ?, ?, ?)');

  const seed = db.transaction(() => {
    [
      ['M0001', 'สมชาย ใจดี', 120], ['M0002', 'น้องพลอย เก่งกล้า', 80],
      ['M0003', 'มานะ พากเพียร', 45], ['M0004', 'วิภา สุขใจ', 30], ['M0005', 'ประยุทธ์ ตั้งใจ', 60]
    ].forEach((member, index) => {
      const details = [
        ['123', 'ถนนสุขุมวิท', 'แขวงคลองตัน', 'เขตคลองเตย', 'กรุงเทพมหานคร', '10110', '2012-05-14', 'ชาย', '2025-01-15'],
        ['45/2', 'ถนนพระราม 4', 'แขวงคลองเตย', 'เขตคลองเตย', 'กรุงเทพมหานคร', '10110', '2013-09-02', 'หญิง', '2025-03-20'],
        ['88', 'ถนนรัชดาภิเษก', 'แขวงดินแดง', 'เขตดินแดง', 'กรุงเทพมหานคร', '10400', '2010-02-11', 'ชาย', '2025-06-10'],
        ['15', 'ถนนลาดพร้าว', 'แขวงจอมพล', 'เขตจตุจักร', 'กรุงเทพมหานคร', '10900', '2011-12-25', 'หญิง', '2025-07-05'],
        ['200', 'ถนนงามวงศ์วาน', 'ตำบลบางเขน', 'อำเภอเมืองนนทบุรี', 'นนทบุรี', '11000', '2009-08-19', 'ชาย', '2024-11-30']
      ][index];
      insertMember.run(member[0], member[1], ...details, member[2]);
    });
    insertTrainer.run('T0001', 'อรุณ ฟิตดี', 'คาร์ดิโอ/เด็ก', '0811111111');
    insertTrainer.run('T0002', 'มานี พลังเยอะ', 'มวย', '0822222222');
    insertTrainer.run('T0003', 'สายฝน ยืดหยุ่น', 'โยคะ', '0833333333');
    insertPlan.run('PL001', 'รายเดือน', 1, 590.00);
    insertPlan.run('PL002', 'ราย 3 เดือน', 3, 1590.00);
    insertPlan.run('PL003', 'รายปี', 12, 5900.00);
    insertClass.run('CL001', 'Roblox Kids Cardio', 'T0001', 15, 'จ พ ศ 16:00-17:00');
    insertClass.run('CL002', 'Boxing Quest', 'T0002', 12, 'อ พฤ 17:00-18:00');
    insertClass.run('CL003', 'Yoga Adventure', 'T0003', 10, 'ส 09:00-10:00');
    db.prepare('INSERT INTO LOCKER VALUES (?, ?, ?)').run('LK001', 'A-01', 'M0001');
    db.prepare('INSERT INTO LOCKER VALUES (?, ?, ?)').run('LK002', 'A-02', 'M0002');
    db.prepare('INSERT INTO LOCKER VALUES (?, ?, ?)').run('LK003', 'A-03', null);
    const insertSubscription = db.prepare('INSERT INTO SUBSCRIPTION VALUES (?, ?, ?, ?, ?)');
    insertSubscription.run('S00001', 'M0001', 'PL002', '2026-07-01', '2026-10-01');
    insertSubscription.run('S00002', 'M0002', 'PL001', '2026-08-01', '2026-09-01');
    insertSubscription.run('S00003', 'M0003', 'PL003', '2026-06-15', '2027-06-15');
    insertSubscription.run('S00004', 'M0004', 'PL001', '2026-08-05', '2026-09-05');
    insertSubscription.run('S00005', 'M0005', 'PL002', '2026-07-20', '2026-10-20');
    const insertPayment = db.prepare('INSERT INTO PAYMENT VALUES (?, ?, ?, ?, ?, ?)');
    insertPayment.run('P00001', 'S00001', 'พร้อมเพย์', 1590.00, 'ชำระแล้ว', '2026-07-01');
    insertPayment.run('P00002', 'S00002', 'เงินสด', 590.00, 'ชำระแล้ว', '2026-08-01');
    insertPayment.run('P00003', 'S00003', 'บัตรเครดิต', 5900.00, 'ชำระแล้ว', '2026-06-15');
    insertPayment.run('P00004', 'S00004', 'เงินสด', 590.00, 'รอชำระ', null);
    insertPayment.run('P00005', 'S00005', 'พร้อมเพย์', 1590.00, 'ชำระแล้ว', '2026-07-20');
    const insertEnrollment = db.prepare('INSERT INTO ENROLLMENT VALUES (?, ?, ?)');
    [['M0001', 'CL001', '2026-07-02'], ['M0001', 'CL002', '2026-07-05'], ['M0002', 'CL001', '2026-08-02'], ['M0003', 'CL003', '2026-06-16'], ['M0003', 'CL001', '2026-06-20'], ['M0004', 'CL002', '2026-08-06'], ['M0005', 'CL003', '2026-07-21']].forEach(row => insertEnrollment.run(...row));
    const insertPhone = db.prepare('INSERT INTO MEMBER_PHONE VALUES (?, ?)');
    [['M0001', '0891234567'], ['M0001', '0261234567'], ['M0002', '0892345678'], ['M0003', '0893456789'], ['M0004', '0894567890'], ['M0005', '0895678901']].forEach(row => insertPhone.run(...row));
    const insertTag = db.prepare('INSERT INTO CLASS_TAG VALUES (?, ?)');
    [['CL001', 'เด็ก'], ['CL001', 'คาร์ดิโอ'], ['CL002', 'มวย'], ['CL002', 'เผาผลาญสูง'], ['CL003', 'โยคะ'], ['CL003', 'ผ่อนคลาย']].forEach(row => insertTag.run(...row));
    const insertPoint = db.prepare('INSERT INTO POINT_TRANSACTION VALUES (?, ?, ?, ?, ?, ?)');
    [['PT0001', 'M0001', 'ได้รับ', 50, '2026-07-02', 'เช็คอินคลาส CL001'], ['PT0002', 'M0001', 'ได้รับ', 50, '2026-07-05', 'เช็คอินคลาส CL002'], ['PT0003', 'M0001', 'ใช้แต้ม', 20, '2026-08-01', 'แลกส่วนลดค่าแพ็กเกจ'], ['PT0004', 'M0002', 'ได้รับ', 80, '2026-08-02', 'เช็คอินคลาส CL001'], ['PT0005', 'M0003', 'ได้รับ', 30, '2026-06-16', 'เช็คอินคลาส CL003'], ['PT0006', 'M0003', 'ได้รับ', 15, '2026-06-20', 'เช็คอินคลาส CL001'], ['PT0007', 'M0004', 'ได้รับ', 30, '2026-08-06', 'เช็คอินคลาส CL002'], ['PT0008', 'M0005', 'ได้รับ', 60, '2026-07-21', 'เช็คอินคลาส CL003']].forEach(row => insertPoint.run(...row));
  });
  seed();
}
seedDatabase();

function renderError(res, error) {
  res.status(400).render('error', { message: `บันทึกข้อมูลไม่สำเร็จ: ${error.message}` });
}

app.get('/', (req, res) => {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
  res.render('index', { stats: {
    members: count('MEMBER'), trainers: count('TRAINER'), classes: count('CLASS'),
    plans: count('MEMBERSHIP_PLAN'), subscriptions: count('SUBSCRIPTION'), enrollments: count('ENROLLMENT')
  }});
});

app.get('/members', (req, res) => {
  const members = db.prepare('SELECT MEMBER_ID, MEMBER_NAME, GENDER, BIRTH_DATE, MEMBER_SINCE_DATE, ROBUX_BALANCE FROM MEMBER ORDER BY MEMBER_ID').all();
  res.render('members', { members });
});
app.get('/members/create', (req, res) => res.render('member-create'));
app.post('/members/create', (req, res) => {
  try {
    const m = req.body;
    db.prepare(`INSERT INTO MEMBER (MEMBER_ID, MEMBER_NAME, MEMBER_HOUSE_NO, MEMBER_STREET, MEMBER_SUBDISTRICT, MEMBER_DISTRICT, MEMBER_PROVINCE, MEMBER_POSTCODE, BIRTH_DATE, GENDER, MEMBER_SINCE_DATE, ROBUX_BALANCE)
      VALUES (@MEMBER_ID, @MEMBER_NAME, @MEMBER_HOUSE_NO, @MEMBER_STREET, @MEMBER_SUBDISTRICT, @MEMBER_DISTRICT, @MEMBER_PROVINCE, @MEMBER_POSTCODE, @BIRTH_DATE, @GENDER, @MEMBER_SINCE_DATE, @ROBUX_BALANCE)`).run(m);
    res.redirect('/members');
  } catch (error) { renderError(res, error); }
});

app.get('/trainers', (req, res) => res.render('trainers', { trainers: db.prepare('SELECT * FROM TRAINER ORDER BY TRAINER_ID').all() }));
app.get('/trainers/create', (req, res) => res.render('trainer-create'));
app.post('/trainers/create', (req, res) => {
  try {
    db.prepare('INSERT INTO TRAINER (TRAINER_ID, TRAINER_NAME, SPECIALTY, TRAINER_PHONE) VALUES (@TRAINER_ID, @TRAINER_NAME, @SPECIALTY, @TRAINER_PHONE)').run(req.body);
    res.redirect('/trainers');
  } catch (error) { renderError(res, error); }
});

app.get('/classes', (req, res) => res.render('classes', { classes: db.prepare('SELECT * FROM CLASS ORDER BY CLASS_ID').all() }));
app.get('/classes/create', (req, res) => res.render('class-create', { trainers: db.prepare('SELECT TRAINER_ID, TRAINER_NAME FROM TRAINER ORDER BY TRAINER_ID').all() }));
app.post('/classes/create', (req, res) => {
  try {
    db.prepare('INSERT INTO CLASS (CLASS_ID, CLASS_NAME, TRAINER_ID, CLASS_CAPACITY, CLASS_SCHEDULE) VALUES (@CLASS_ID, @CLASS_NAME, @TRAINER_ID, @CLASS_CAPACITY, @CLASS_SCHEDULE)').run(req.body);
    res.redirect('/classes');
  } catch (error) { renderError(res, error); }
});

app.use((req, res) => res.status(404).render('error', { message: 'ไม่พบหน้าที่ต้องการ' }));
app.listen(PORT, () => console.log(`GYM ROBLOX is running at http://localhost:${PORT}`));
