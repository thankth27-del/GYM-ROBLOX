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
    MEMBER_ID CHAR(5) PRIMARY KEY,
    MEMBER_NAME VARCHAR(50), MEMBER_HOUSE_NO, MEMBER_STREET,
    MEMBER_SUBDISTRICT, MEMBER_DISTRICT, MEMBER_PROVINCE,
    MEMBER_POSTCODE CHAR(5), BIRTH_DATE DATE, GENDER VARCHAR(10),
    MEMBER_SINCE_DATE DATE, ROBUX_BALANCE INT DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS TRAINER (
    TRAINER_ID CHAR(5) PRIMARY KEY, TRAINER_NAME, SPECIALTY, TRAINER_PHONE CHAR(10)
  );
  CREATE TABLE IF NOT EXISTS MEMBERSHIP_PLAN (
    PLAN_ID CHAR(5) PRIMARY KEY, PLAN_NAME, DURATION_MONTHS INT, PRICE DECIMAL(8,2)
  );
  CREATE TABLE IF NOT EXISTS CLASS (
    CLASS_ID CHAR(5) PRIMARY KEY, CLASS_NAME, TRAINER_ID,
    CLASS_CAPACITY INT, CLASS_SCHEDULE,
    FOREIGN KEY (TRAINER_ID) REFERENCES TRAINER(TRAINER_ID)
  );
  CREATE TABLE IF NOT EXISTS LOCKER (
    LOCKER_ID CHAR(5) PRIMARY KEY, LOCKER_NUMBER, MEMBER_ID UNIQUE,
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID)
  );
  CREATE TABLE IF NOT EXISTS SUBSCRIPTION (
    SUBSCRIPTION_ID CHAR(6) PRIMARY KEY, MEMBER_ID, PLAN_ID,
    START_DATE, SUBSCRIPTION_END_DATE,
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID),
    FOREIGN KEY (PLAN_ID) REFERENCES MEMBERSHIP_PLAN(PLAN_ID)
  );
  CREATE TABLE IF NOT EXISTS PAYMENT (
    PAYMENT_ID CHAR(6) PRIMARY KEY, SUBSCRIPTION_ID UNIQUE, PAYMENT_METHOD,
    PAYMENT_AMOUNT DECIMAL(8,2), PAYMENT_STATUS DEFAULT 'pending', PAYMENT_DATE,
    FOREIGN KEY (SUBSCRIPTION_ID) REFERENCES SUBSCRIPTION(SUBSCRIPTION_ID)
  );
  CREATE TABLE IF NOT EXISTS ENROLLMENT (
    MEMBER_ID, CLASS_ID, ENROLL_DATE,
    PRIMARY KEY (MEMBER_ID, CLASS_ID),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID),
    FOREIGN KEY (CLASS_ID) REFERENCES CLASS(CLASS_ID)
  );
  CREATE TABLE IF NOT EXISTS MEMBER_PHONE (
    MEMBER_ID, PHONE_NUMBER,
    PRIMARY KEY (MEMBER_ID, PHONE_NUMBER),
    FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID)
  );
  CREATE TABLE IF NOT EXISTS CLASS_TAG (
    CLASS_ID, TAG_NAME,
    PRIMARY KEY (CLASS_ID, TAG_NAME),
    FOREIGN KEY (CLASS_ID) REFERENCES CLASS(CLASS_ID)
  );
  CREATE TABLE IF NOT EXISTS POINT_TRANSACTION (
    POINT_TX_ID CHAR(6) PRIMARY KEY, MEMBER_ID, TX_TYPE, POINT_AMOUNT, TX_DATE, TX_REASON,
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
  const insertClass = db.prepare('INSERT INTO CLASS VALUES (?, ?, ?, ?, ?)');

  const seed = db.transaction(() => {
    [
      ['M0001', 'สมชาย ใจดี', 120], ['M0002', 'น้องพลอย เก่งกล้า', 80],
      ['M0003', 'มานะ พากเพียร', 45], ['M0004', 'วิภา สุขใจ', 30], ['M0005', 'ประยุทธ์ ตั้งใจ', 60]
    ].forEach((member, index) => {
      insertMember.run(member[0], member[1], `${10 + index}`, 'Roblox Road', 'Game Town', 'Pixel City', 'Bangkok', '10100', `199${index}-01-01`, index % 2 === 0 ? 'ชาย' : 'หญิง', '2025-01-01', member[2]);
    });
    insertTrainer.run('T0001', 'อรุณ ฟิตดี', 'คาร์ดิโอ', '0811111111');
    insertTrainer.run('T0002', 'มานี พลังเยอะ', 'มวย', '0822222222');
    insertTrainer.run('T0003', 'สายฝน ยืดหยุ่น', 'โยคะ', '0833333333');
    insertClass.run('CL001', 'Roblox Kids Cardio', 'T0001', 15, 'จ พ ศ 16:00-17:00');
    insertClass.run('CL002', 'Boxing Quest', 'T0002', 12, 'อ พฤ 17:00-18:00');
    insertClass.run('CL003', 'Yoga Adventure', 'T0003', 10, 'ส 09:00-10:00');
    db.prepare('INSERT INTO MEMBERSHIP_PLAN VALUES (?, ?, ?, ?)').run('P0001', 'Starter', 1, 299);
    db.prepare('INSERT INTO SUBSCRIPTION VALUES (?, ?, ?, ?, ?)').run('S00001', 'M0001', 'P0001', '2025-01-01', '2025-02-01');
    db.prepare('INSERT INTO ENROLLMENT VALUES (?, ?, ?)').run('M0001', 'CL001', '2025-01-02');
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
