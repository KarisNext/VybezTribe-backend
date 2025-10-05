Admin auth.js, session.js, and user.js are here C:\Projects\VybezTribe\backend\routes\admin
in the middleware we have C:\Projects\VybezTribe\backend\middleware\adminAuth.js and clientAuth.js
in the client side here C:\Projects\VybezTribe\backend\routes\client we have auth.js and clientsession.js


Well
Admin C:\Projects\VybezTribe\frontend\src\app\admin\page.tsx while I have transferred the client C:\Projects\VybezTribe\frontend\src\app\client\page.tsx, the main main page here. 
Now the admin login page is here C:\Projects\VybezTribe\frontend\src\app\auth\login\page.tsx, not inside auth folder, of course when we try to access the admin it redirects to login, Now lets fix the session paths, nothing great has changed only the paths, and also our main page wash shifted from app/page.tsx, to app/client/page.tsx
FetchAll.tsx, C:\Projects\VybezTribe\frontend\src\components\client\hooks\ FetchAll.tsx and ClientSessions.tsx are here, while the admin Session is here C:\Projects\VybezTribe\frontend\src\components\includes\Session.tsx is here 