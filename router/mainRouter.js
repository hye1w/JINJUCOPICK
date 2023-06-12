const express = require('express')
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../model/db');
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const multer = require('multer');
const path = require('path');
const fs = require('fs')

var authCheck = require('../public/js/authCheck.js');
const f = require('session-file-store');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));

router.use(session({
    secret: "key",
    resave: false,
    saveUninitialized:true,
    store:new FileStore(),
}))

router.get("/", function(req,res){ //메인화면
    var email = req.session.email;
    if(email){
        result1={"login":1}
    }else{
        result1={"login":0}
    }
    db.query('select * from gifticon where email = ?',[email], function(err, result){ 
        var today = new Date();
        var expiringCount = 0;
        for(let i =0; i<result.length;i++){
            var gifticon = result[i];
            var date = new Date(gifticon.date);
            if(date<=new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && date>= today){
                expiringCount++;
            }
        }
        if(expiringCount>=1 && notice == 1){
            notice = 0;
            res.send(`<script type="text/javascript">
            res = confirm("일주일 안에 만료되는 기프티콘이 "+ ${expiringCount} + "개 있습니다. 확인하시겠습니까?");
            if(res){
                document.location.href="/gifticon_upload";
            }else{
                document.location.href="/";
            }
            </script>`);
        }else{
            res.render('main',{data:result, data1:result1}) //메인화면 연결(로그인 후)
        }
    })
})

router.get("/login", function(req,res){
    res.render('login')
})

var notice; // 유효기간 만료 팝업창 1회 안내

router.post('/login/result', function(req, res) { //로그인
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {             // email과 pw가 입력되었는지 확인
        db.query('SELECT * FROM information WHERE email = ? AND password = ?', [email, password], function(error, results, fields) { // 이메일 및 패스워드 확인
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 로그인 성공  
                notice = 1  // 유효기간 만료 팝업창 1회 안내
                req.session.is_logined = true; // 세션 정보 갱신(세션 저장)
                req.session.email = email; 
                req.session.save(function () {
                res.redirect(`/`);
                });
                
            } else {              
                res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="javascript:history.back();";</script>`);    // 뒤로가기
            }            
        });

    } else {
        res.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="javascript:history.back();";</script>`);    
    }
});

router.get('/logout', function(req,res){ //로그아웃
    req.session.destroy(function(err){ //세션 삭제
        res.redirect('/');
        console.log("로그아웃");
    });
});

router.get("/signup", function(req,res){ //회원가입 화면
    res.render('signup')
})

router.post("/signup/submit", function(req,res){ //회원가입 제출

    var email = req.body.email;
    var password1 = req.body.password1;
    var password2 = req.body.password2;
    var nickname = req.body.nickname; 

    if (email && password1 && password2 && nickname) {
        
        db.query('SELECT * FROM information WHERE nickname = ?', [nickname], function(error, results, fields) { // DB에 같은 닉네임 있는지 확인
            if (error) throw error;
            if (results.length <= 0) { 
                db.query('SELECT * FROM information WHERE email = ?', [email], function(error, results, fields){ // DB에 같은 이메일 있는지 확인
                    if (results.length <= 0) {
                        db.query('INSERT INTO information (nickname, password, email) VALUES(?,?,?)', [nickname, password1, email], function (error, data) {
                            if (error) throw error2;
                            res.send(`<script type="text/javascript">alert("가입을 환영합니다!");
                            document.location.href="/";</script>`);
                        });
                    } 
                    else{
                        res.send(`<script type="text/javascript">alert("이미 존재하는 이메일입니다."); 
                        document.location.href="javascript:history.back();";</script>`);    
                    }
                });
            } 
            else {                                                  
                res.send(`<script type="text/javascript">alert("이미 존재하는 닉네임입니다."); 
                document.location.href="javascript:history.back();";</script>`);    
            }            
        });

    } else {    
        res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="javascript:history.back();";</script>`);
    }
});

router.get("/mypage", function(req,res){ //마이페이지
    if(authCheck.isOwner(req,res)){
        var email = req.session.email;
        db.query('select * from information where email = ?',[email], function(err, result){ 
            if (result.length > 0) {
                res.render('mypage',{data:result})
            } else{
                res.redirect('/');
            }
        });
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.get("/mypage/nickname", function(req,res){ //마이페이지 닉네임 변경 선택 시 -> password_check1
    if(authCheck.isOwner(req,res)){
        res.render('password_check1')
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.post("/mypage/nickname", function(req,res){ // 닉네임 password_check1 화면 submit
    var email = req.session.email;
    var password = req.body.password;
    if(authCheck.isOwner(req,res)){
        db.query('SELECT * FROM information where email = ? and password = ?', [email, password], function (error, result) {
            if (error) throw error;
            if (result.length > 0) {
                res.render('nickname_change',{data:result})
            }else{
                res.send(`<script type="text/javascript">alert("비밀번호를 다시 확인하세요.");
                document.location.href="/mypage/nickname";</script>`);
            }
            });
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.post('/mypage/nickname/change', function(req,res){ //마이페이지 닉네임 변경 submit
    var email = req.session.email;
    var nickname = req.body.nickname;
    if(authCheck.isOwner(req,res)){
        db.query('SELECT * FROM information where nickname = ?', [nickname], function (error, result) {
            if (error) throw error;
            if (result.length > 0) {
                res.send(`<script type="text/javascript">alert("다른 닉네임을 입력해주세요.");
                document.location.href="javascript:history.back();";</script>`);
            } else{
                db.query('UPDATE information SET nickname = ? where email = ?', [nickname, email], function (error, result) {
                    db.query('UPDATE community SET nickname = ? where email = ?', [nickname, email], function (error, result) {
                        db.query('UPDATE comment SET nickname = ? where email = ?', [nickname, email], function (error, result) {
                            db.query('UPDATE cafereview SET nickname = ? where email = ?', [nickname, email], function (error, result) {
                                res.send(`<script type="text/javascript">alert("닉네임이 변경되었습니다.");
                                window.close();window.opener.location.reload();</script>`);
                            })
                        })
                    })
                })
            }
        })
        return false; 
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.get("/mypage/password", function(req,res){ //마이페이지 패스워드 변경 버튼 선택 시 -> password_check2
    if(authCheck.isOwner(req,res)){
        res.render('password_check2')
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.post("/mypage/password", function(req,res){ //마이페이지 패스워드 password_check2 submit
    var email = req.session.email;
    var password = req.body.password;
    if(authCheck.isOwner(req,res)){
        
        db.query('SELECT * FROM information where email = ? and password = ?', [email, password], function (error, result) {
            if (error) throw error;
            if (result.length > 0) {
                res.render('password_change',{data:result})
            }else{
                res.send(`<script type="text/javascript">alert("비밀번호를 다시 확인하세요.");
                document.location.href="/mypage/password";</script>`);
            }
            });
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.post('/mypage/password/change', function(req,res){ //마이페이지 패스워드 변경 submit
    var email = req.session.email;
    var password1 = req.body.password1;
    var password2 = req.body.password2;

    if(authCheck.isOwner(req,res)){
        if(password1&&password2){
            if(password1 == password2){
                db.query('UPDATE information SET password = ? where email = ?', [password1, email], function (error, result) {
                    if (error) throw error;
                    res.send(`<script type="text/javascript">alert("비밀번호가 변경되었습니다");
                    window.close();</script>`);
                })
            } else{
                res.send(`<script type="text/javascript">alert("비밀번호가 다릅니다."); 
                document.location.href="javascript:history.back();";</script>`); 
            }
        } else{
            res.send(`<script type="text/javascript">alert("비밀번호를 입력해주세요."); 
                document.location.href="javascript:history.back();";</script>`); 
        }

        return false; 
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.get("/gifticon_upload", function(req,res){ //기프티콘 업로드 화면
    if(authCheck.isOwner(req,res)){
        var email = req.session.email;
        db.query('select * from gifticon where email = ?',[email], function(err, result){ 
            if (result.length > 0) {
                res.render('gifticon_upload',{data:result})
            } else{
                var result1 = {"email":email};
                res.render('gifticon_upload',{data:result1})
            }
        });
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

try {
    fs.readdirSync('public/uploads');
} catch (err) {
    console.log('폴더 생성');
    fs.mkdirSync('public/uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, `public/uploads`);
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    // 용량 제한
    limits: { fieldSize: 5 * 1024 * 1024 },
});

router.post("/gifticon_upload/submit", upload.single('gifticonImg'),(req,res,next)=>{ //기프티콘 사진 업로드
    var email = req.session.email;
    var cafeName = req.body.cafeName;
    var expirationDate = req.body.expirationDate;
    var gifticonImg = `public/uploads/${req.file.filename}`;
    
    db.query('INSERT INTO gifticon (email, name, date, gifticon) VALUES(?,?,?,?)', [email, cafeName, expirationDate,
        gifticonImg], function (error, data) {
        if (error) throw error;
            res.redirect("/gifticon_upload");
        });
})

router.post("/gifticon_upload/delete", function(req,res){ //기프티콘 삭제
    var del = req.body.check;
    if(authCheck.isOwner(req,res)){
            if(!del){
            } else if(del[0]!='p'){ // 
                for(i=0; i<del.length; i++){
                    if (fs.existsSync(del[i])) {
                        try {
                            fs.unlinkSync(del[i]);
                        } catch (error) {
                            console.log(error);
                        }
                        }
                    db.query('delete from gifticon where gifticon = ?',[del[i]], function(err, result){})
                }
            } else{
                if (fs.existsSync(del)) {
                    try {
                        fs.unlinkSync(del);
                    } catch (error) {
                        console.log(error);
                    }
                    }
                db.query('delete from gifticon where gifticon = ?',[del], function(err, result){})
        }
        res.redirect('/gifticon_upload');
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.get("/community", function(req,res){ //커뮤니티 게시판 목록 화면 페이징
    if(authCheck.isOwner(req,res)){
        const perPage = 5; // 한 페이지에 보여질 게시물 수

        const page = req.query.page ? parseInt(req.query.page) : 1; // 요청 페이지 번호

        // 해당 페이지에 표시할 게시물
        const offset = (page - 1) * perPage;
        const query = `SELECT * FROM community ORDER BY writeTime DESC LIMIT ${perPage} OFFSET ${offset}`;

        // 전체 게시물 수 
        db.query('SELECT COUNT(*) as count FROM community', function(err, result){
            if(err) throw err;
            const totalCount = result[0].count;

            const pageCount = Math.ceil(totalCount / perPage); // 총 페이지 수 

            db.query(query, function(err, result){
                if(err) throw err;
                res.render('communityList', { data: result, pageCount, currentPage: page, totalCount });
            });
        });
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
});

router.get("/community/:nickname/:writeTime/:num", function(req,res){ //커뮤니티 게시판 상세보기 화면
    var email = req.session.email;

    if(authCheck.isOwner(req,res)){
        db.query('select * from community where nickname = ? and writeTime = ? and num = ?',[req.params.nickname,req.params.writeTime,req.params.num], function(err, result){ 
            db.query('select * from information where email = ?',[email],function (error, results) { //로그인된 이메일 확인 
                var nick = results[0].nickname; //닉네임 찾기
                var nickname = {"nick":nick}
            if(email == result[0].email){ 
                var result2 = {"edit":"1"};
                db.query('select * from comment where num = ?', [req.params.num], function(err, comm) { 
                    res.render('communityRead',{data:result, data1:result2, comm:comm, nickname:nickname})  
                });
            }else{
                var result2 = {"edit":"0"};
                db.query('select * from comment where num = ?', [req.params.num], function(err, comm) { 
                    res.render('communityRead',{data:result, data1:result2, comm:comm, nickname:nickname})   
                });
                return false; 
            }
        })
        });
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.get("/community/write", function(req,res){ //커뮤니티 게시판 작성 화면
    if(authCheck.isOwner(req,res)){
        res.render('community')
        return false;
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }
})

router.post("/community/write/submit", function(req,res){ //게시판 글 작성하기
    var email = req.session.email;  
    var title = req.body.title;
    var people = req.body.people;
    var purpose = req.body.purpose;
    var date = req.body.date;
    var content = req.body.content; 
    var writeTime = new Date();
    var nickname;    

    if (email&&title&&people&&purpose&&content&&date) {
        db.query('select * from information where email = ?',[email],function (error, results) { //로그인된 이메일 확인 
            nickname = results[0].nickname; //닉네임 찾기
            db.query('INSERT INTO community (email, nickname, title, people, purpose, date, content, writeTime) VALUES(?,?,?,?,?,?,?,?)', [email, nickname, title, people, purpose, date, content, writeTime], function (error, data) {
                if (error) throw error;
                    res.send(`<script type="text/javascript">alert("글이 등록되었습니다.");
                    document.location.href="/community";</script>`);
                });
        });       
    } 
})

router.get("/community/:nickname/:writeTime/:num/modify", function(req,res){ //커뮤니티 글 수정 화면
    var email = req.session.email;

    if(authCheck.isOwner(req,res)){
        db.query('select * from community where nickname = ? and writeTime = ? and num = ?',[req.params.nickname,req.params.writeTime,req.params.num], function(err, result){ 
            if(email == result[0].email){
                var result2 = {"edit":"1"};
                res.render('communityModify',{data:result, data1:result2})
            }else{
                var result2 = {"edit":"0"};
                res.render('communityModify',{data:result, data1:result2})
                return false; 
            }
        });
    } else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
                document.location.href="/login";</script>`);
    }  
})

router.post("/community/modify/submit", function(req, res) { //커뮤니티 글 수정
    var email = req.session.email;    
    var title = req.body.title;
    var people = req.body.people;
    var purpose = req.body.purpose;
    var date = req.body.date;
    var content = req.body.content;

    if (email&&title&&people&&purpose&&content&&date) {
        db.query('select * from community where num = ?',[req.body.num], function (err, result) {
            
          db.query('UPDATE community SET title=?, people=?, purpose=?, date=?, content=? WHERE num=?', [title, people, purpose, date, content, req.body.num], function (error, data) {
          if (error) throw error;
              res.send(`<script type="text/javascript">alert("수정이 완료되었습니다.");
              document.location.href="/community";</script>`);
          });
      });
    }
  })

router.post("/community/:nickname/:writeTime/:num", function(req, res) { //커뮤니티 댓글 작성
    var email = req.session.email;   
    var num = req.params.num;
    var commentdata = req.body.commentdata;
    var writeTime = new Date();
  
    if (commentdata) {
        db.query('SELECT nickname FROM information WHERE email = ?', [email], function (err, result) {
            if (err) throw err;
            var nickname = result[0].nickname; // 결과에서 nickname 값을 가져옴

            db.query('SELECT * FROM community WHERE num=?', [num], function (err, result) {
                if (err) throw err;
                
                db.query('INSERT INTO comment (num, email, nickname, commentdata, writeTime) VALUES(?,?,?,?,?)',[num, email, nickname, commentdata, writeTime], function (error, result) {
                    if (error) throw error;
                    res.send(`<script type="text/javascript">alert("댓글이 등록되었습니다.");
                    location.href = location.href;</script>`);             
                });
            });
        });
    }
});

router.post("/community/:num/:no", function(req, res) { //커뮤니티 선택 댓글 삭제하기
    var num = req.params.num;

    db.query('SELECT * FROM community WHERE num=?', [num], function (err, result) {
        if (err) throw err; 

        db.query('DELETE FROM comment WHERE num=? and no =?', [num, req.params.no], function (error, comm) {
          if (error) throw error; 
          res.send(`<script type="text/javascript">alert("댓글이 삭제되었습니다.");
          document.location.href="/community/${result[0].nickname}/${result[0].writeTime}/${num}";</script>`);  
        });
    });
});

router.post("/community/:nickname/:writeTime/:num/delete", function(req, res) { //커뮤니티 선택 게시글 삭제하기
    var num = req.params.num;

    db.query('DELETE FROM community WHERE num=?', [num], function (err, result) {
        if (err) throw err; 
        res.send(`<script type="text/javascript">alert("글이 삭제되었습니다.");
        document.location.href="/community";</script>`); 
    });
});

router.post("/filter", function(req, res) { //메인화면 필터링
    var filter1 = req.body.selectfilter1;
    var filter2 = req.body.selectfilter2;
    var filter3 = req.body.selectfilter3;

    var area1 = req.body.selectMap1;
    var area2 = req.body.selectMap2;
    var area3 = req.body.selectMap3;

    if (filter2 === '' && filter3 === '') {
        filter2 = null;
        filter3 = null;
    }
    else if (filter3 === '') {
        filter3 = null;
    }

    if (area2 === 'undefined' && area3 === 'undefined') {
        area2 = null;
        area3 = null;
    }
    else if (area3 === 'undefined') {
        area3 = null;
    }

    var price = req.body.price ? req.body.price : 0;   

    if(filter1=="" || filter1 === 'undefined') {// 필터가 선택되지 않은 경우
        res.send(`<script type="text/javascript">alert("찾으시는 조건을 1개 이상 선택해주세요."); history.back();</script>`);
    }
    else if(area1=="" || area1 === 'undefined') { //지도 선택되지 않은 경우
        res.send(`<script type="text/javascript">alert("지도에서 위치를 1개 이상 선택해주세요."); history.back();</script>`);
    }
    else if (price == 0) { // range값이 선택되지 않은 경우
        res.send(`<script type="text/javascript">alert("가격대를 선택해주세요."); history.back();</script>`);
    }  
    else { // 필터, 지역, 가격대 선택된 경우
        db.query('UPDATE filtering SET filter1 = ?, filter2 = ?, filter3 = ?, price =?, area1 =?, area2 =?, area3 =? WHERE num = 1',
        [filter1, filter2, filter3, price,area1,area2,area3], function (error, filter) {
            if (error) throw error;
            res.send(`<script type="text/javascript">
            document.location.href="/cafe";</script>`); //최종본에서 alert 삭제
        });
    }
}); 

router.get("/cafe", function(req,res){ //필터링 결과 카페 리스트 페이지
    var email = req.session.email;
    db.query('select * from filtering', function(err, cfilter){   
        var filter = cfilter[0]
        var area1 = filter.area1
        var area2 = filter.area2
        var area3 = filter.area3
        var price = filter.price
        var filter1 = filter.filter1
        var filter2 = filter.filter2
        var filter3 = filter.filter3 

        if(filter.filter1 !== 'nothing') { 
            db.query('select * from cafe where (' + filter1 + ' = 1 or ' + filter2 + ' = 1 or ' + filter3 + ' = 1) ' + 
            'and (area = ? or area = ? or area = ?) and price <= ? ' + 'order by case ' + 'when ' + filter1 + ' = 1 and ' + filter2 + ' = 1 and ' + filter3 + ' = 1 then 1 ' +
            'when (' + filter1 + ' = 1 and ' + filter2 + ' = 1) or (' + filter1 + ' = 1 and ' + filter3 + ' = 1) or (' +
            filter2 + ' = 1 and ' + filter3 + ' = 1) then 2 ' + 'else 3 end, if(average > 0, average, 0) desc, count desc', [area1,area2,area3, price], function(err, results) {  
                var correct = {
                    cafes: [] // 카페 데이터를 저장할 배열
                };
                var filterMapping = {
                    dessert: '디저트',
                    pet: '애견동반',
                    nokids: '노키즈존',
                    takeout: '테이크아웃',
                    delivery: '배달',
                    meeting: '단체석',
                    franchise: '프랜차이즈',
                    parking: '주차장' 
                };

                if (err) throw err;  

                for (var i = 0; i < results.length; i++) {
                    var cafe = results[i];
                    var correctfilter = []; // 각 카페의 일치 조건 저장
            
                    // 카페가 어떤 조건을 만족했는지 확인하여 조건 저장
                    if (cafe[filter1] === 1) {
                        // correctfilter.push(filter1);
                        correctfilter.push(filterMapping[filter1]);
                    }
                    if (cafe[filter2] === 1) {
                        // correctfilter.push(filter2);
                        correctfilter.push(filterMapping[filter2]);
                    }
                    if (cafe[filter3] === 1) {
                        // correctfilter.push(filter3);
                        correctfilter.push(filterMapping[filter3]);
                    }
            
                    // 해당 카페의 조건 배열을 카페 데이터에 추가
                    cafe.correct = correctfilter;
                    // 카페 데이터를 correct 객체의 배열에 추가
                    correct.cafes.push(cafe);
                    }

                if(results.length<=0){ // 해당하는 카페가 없을 경우
                    res.send(`<script type="text/javascript">alert("해당하는 카페가 없습니다.");  
                    document.location.href="/";</script>`); 
                } else{
                    if(email){
                        result={"login":1}
                    } else{
                        result={"login":0}
                    }
                    res.render('cafe_list',{data1:result, cafe:results, filter:cfilter}) 
                }
            });
        } else if(filter1 == 'nothing'){
            db.query('(SELECT * FROM cafe WHERE area = ? AND price <= ? ORDER BY CASE WHEN average > 0 THEN average ELSE 0 END DESC, count DESC LIMIT 10)' +
            'UNION ' +
            '(SELECT * FROM cafe WHERE area = ? AND price <= ? ORDER BY CASE WHEN average > 0 THEN average ELSE 0 END DESC, count DESC LIMIT 10)' +
            'UNION ' +
            '(SELECT * FROM cafe WHERE area = ? AND price <= ? ORDER BY CASE WHEN average > 0 THEN average ELSE 0 END DESC, count DESC LIMIT 10)',[area1, price, area2, price, area3, price], function(err, results){
                //nothing인 경우 조건 배열 비우기
                var correct = {
                    cafes: []  
                };
                for (var i = 0; i < results.length; i++) {
                    var cafe = results[i]; 
                    cafe.correct = ""; 
                    correct.cafes.push(cafe);
                } 
                
                if(results.length<=0){ // 해당하는 카페가 없을 경우
                    res.send(`<script type="text/javascript">alert("해당하는 카페가 없습니다.");  
                    document.location.href="/";</script>`); 
                } else{
                    if(email){
                        result={"login":1}
                    } else{
                        result={"login":0}
                    }
                    res.render('cafe_list',{data1:result, cafe:results, filter:cfilter}) 
                }
            })
        }
    })
})

router.get("/cafe_info/:cafename", function(req,res){ //카페 상세 페이지
    var email = req.session.email;
    var cafe = req.params.cafename;
    db.query('SELECT * FROM cafe where cafename = ?',[cafe], function(err, result){
        db.query('SELECT * FROM cafereview where cafe = ?',[cafe], function(err, result2){ 
            db.query('SELECT * FROM information where email = ?',[email], function(err, result3){
                if(email){
                    result1={"login":1}
                }else{
                    result1={"login":0}
                } 
                res.render('cafe_info',{data:result, data1:result1, data2:result2, data3:result3})
            })
        })
    })
})

router.post("/cafe_info/:cafe", function(req,res){ //카페 리뷰 등록
    var email = req.session.email; 
    var cafe = req.params.cafe;
    var review = req.body.review;
    var score = req.body.score;
    var count = req.body.count;
    var writeTime = new Date();

    if(authCheck.isOwner(req,res)){
        if(review){
            db.query('SELECT * FROM cafereview WHERE email = ? and cafe = ?', [email, cafe], function (err, result) {
                if(result.length>=3){
                    res.send(`<script type="text/javascript">alert("최대 3개의 리뷰까지 등록 가능합니다.");
                    location.href = "/cafe_info/${cafe}";</script>`);
                } else{
                    db.query('SELECT nickname FROM information WHERE email = ?', [email], function (err, result) {
                        var nickname = result[0].nickname; // 결과에서 nickname 값을 가져옴
                        db.query('INSERT INTO cafereview (cafe, email, nickname, score, review, writeTime) VALUES(?,?,?,?,?,?)',[cafe, email, nickname, score/2, review, writeTime], function (error, result) {
                            db.query('UPDATE cafe SET score = score + ?, count = count + 1, average = score / count WHERE cafename = ?', [score/2, cafe], function(error, score) {
                                
                            if (error) throw error;
                            res.send(`<script type="text/javascript">alert("리뷰가 등록되었습니다.");
                            location.href = "/cafe_info/${cafe}";</script>`);  
                            })           
                        });
                        
                    })
                }
            })
        }
    }else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용 가능합니다.");
        document.location.href="javascript:history.back();";</script>`); 
    }
})

router.post("/review/:cafe/:num", function(req, res) { //카페 리뷰 삭제
    var num = req.params.num;
    var cafe = req.params.cafe;
  
    db.query('SELECT score FROM cafereview WHERE num = ?', [num], function(err, rows) {
      if (err) throw err;
  
      if (rows.length > 0) {
        var score = rows[0].score;
  
        db.query('DELETE FROM cafereview WHERE num = ?', [num], function(err, result) {
          if (err) throw err;
  
          db.query('UPDATE cafe SET score = score - ?, count = count - 1, average = IF(count > 0, score / count, 0) WHERE cafename = ?', [score, cafe], function(error, score) {
            if (error) throw error;
  
            res.send(`<script type="text/javascript">alert("리뷰가 삭제되었습니다.");
            document.location.href="/cafe_info/${cafe}";</script>`); 
          });
        });
      } 
    });
});


module.exports = router;
