# GYM ROBLOX

Web Application สำหรับ Bonus Project ระบบจัดการข้อมูลยิมธีม Gaming Gym ใช้สำหรับดูและเพิ่มข้อมูลสมาชิก Trainer และ Class

## เทคโนโลยี

- Node.js และ Express.js
- EJS
- SQLite ผ่าน better-sqlite3
- HTML, CSS และ JavaScript (ฝั่งหน้าเว็บเป็น HTML/CSS ปกติ)

## วิธีติดตั้งและรัน

1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ `GYM_ROBLOX`
2. ติดตั้ง package ด้วยคำสั่ง `npm install`
3. รัน server ด้วยคำสั่ง `npm start`
4. เปิดเว็บที่ `http://localhost:3000`

## Database

ไฟล์ฐานข้อมูลแบบ persistent อยู่ที่ `database/gym_roblox.db` ข้อมูลจะยังอยู่หลังปิดหรือเปิด server ใหม่ และระบบจะเพิ่ม sample data เฉพาะตอนฐานข้อมูลยังไม่มีสมาชิกเท่านั้น

ตารางทั้งหมดที่สร้าง: `MEMBER`, `TRAINER`, `MEMBERSHIP_PLAN`, `CLASS`, `LOCKER`, `SUBSCRIPTION`, `PAYMENT`, `ENROLLMENT`, `MEMBER_PHONE`, `CLASS_TAG`, `POINT_TRANSACTION`

## การใช้งาน

- Dashboard (`/`) แสดงจำนวนข้อมูลจริงจาก SQLite
- Members (`/members`) ดูรายชื่อสมาชิก และกด **เพิ่มสมาชิก** เพื่อบันทึกข้อมูล
- Trainers (`/trainers`) ดูรายชื่อ Trainer และกด **เพิ่ม Trainer** เพื่อบันทึกข้อมูล
- Classes (`/classes`) ดู Class และกด **เพิ่ม Class** โดยเลือก Trainer จาก dropdown ที่ดึงจากฐานข้อมูลจริง
