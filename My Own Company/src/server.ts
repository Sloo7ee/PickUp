import express, { Request, Response } from 'express'
import { connectDB, prisma } from "./config/db";
import {Father , Son , Teacher , Class , Callout, Admin, Prisma, } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
var cookieParser = require('cookie-parser')


const app = express()
app.use(express.json())
app.use(cookieParser())

const PORT = 7999;

// Father requests

app.post('/fatherpage/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const father = await prisma.father.findUnique({
        where: { username: username },
    });

    if (!father || father.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' })
    }

    res.cookie('tokenauth', father.id , {maxAge: 360000})
    res.json('Login successful');
    
});


app.get('/fatherpage/logout', (req: Request, res: Response) => {
    res.clearCookie('tokenauth')
    res.json('Logout successful');
})


app.post('/createFather', async (req: Request, res: Response) => {
    const NewFather = req.body as Father;
    await prisma.father.create({
        data: NewFather
    })
    res.json("done")
})




app.get('/bringmysonout/:sonId', async (req, res) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.father.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json('Invalid token')
        }   
    }
    else{
        return res.status(401).json('Invalid token')
    }
    const { sonId } = req.params;
    const father_username = await prisma.father.findUnique({
        where: { id: req.cookies.tokenauth },
        select: { username: true },
    })

    console.log(father_username?.username);
    

    const isSonConnectedToFather = await prisma.son.findUnique({
        where: {
            id: sonId,
            father_username: father_username?.username,
        },
    });
    if (!isSonConnectedToFather) {
        return res.status(401).json('you are not the father of this son')
    }
    const son = await prisma.son.findMany({
        where: { id: sonId },
        include: { father: true, teacher: true, class: true },
    });

    if (!son || son.length === 0) {
        return res.status(404).json('Son not found');
    }

    if (!son[0].teacher || !son[0].teacher.username) {
        return res.status(400).json('Teacher information missing for the son.');
    }

    const father = await prisma.callout.create({
        data: {
            name: son[0].name,
            Son: {
                connect: { id: sonId },
            },
            teacher: {
                connect: { username: son[0].teacher.username },
            },
            class: {
                connect: { name: son[0].class_name || undefined },
            },
            Status: "waiting",
        },
    });

    res.json("done");
});


app.delete('/recive/:name', async (req, res) => {
    const { name } = req.params;
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.father.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json('Invalid token')
        }   
    }
    else{
        return res.status(401).json('Invalid token')
    }
    const father_username = await prisma.father.findUnique({
        where: { id: req.cookies.tokenauth },
        select: { username: true },
    })

    console.log(father_username?.username);
    
    const check = await prisma.callout.findUnique({
        where: { name: name },
    })
    if (!check) {
        return res.status(404).json('Callout not found');
    }
    
    const deletedCallout = await prisma.callout.delete({
        where: { name: name },
    });

    res.json(deletedCallout);

});

// admin requests

app.get('/getallCallouts', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const all = await prisma.callout.findMany()
    res.json(all)
})

app.get('/getallFathers', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }

    const fathers = await prisma.father.findMany({
        select: {
            id: true,
            name: true,
            password:true,
            son: {
                select: {
                    id: true,
                    name: true,
                    yearofbrith: true,
                },
            },
        },
    });
    
    res.json(fathers)
})


app.post('/createAdmin', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const NewAdmin = req.body as Admin;
    await prisma.admin.create({
        data: NewAdmin
    })
    res.json("done")
})

app.get('/getallAdmins', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }

    const admins = await prisma.admin.findMany()
    res.json(admins)
})

app.post('/admin/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({
        where: { username: username },
    });

    if (!admin || admin.password!== password) {
        return res.status(401).json({ error: 'Invalid username or password' })
    }

    res.cookie('tokenauth', admin.id, {maxAge: 360000})
    res.json('Login successful');
})

app.get('/admin/logout', async (req: Request, res: Response) => {
    res.clearCookie('tokenauth')
    res.json('Logout successful');
})

app.get('/getallteachers', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const teachers = await prisma.teacher.findMany({
        select:{
            id:true,
            name:true,
            studnets:true,
            class_name:true,
            callout:true,
        }
    })
    res.json(teachers)
})


app.post('/createclass', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const NewClass = req.body as Class;
    await prisma.class.create({
        data: NewClass
    })
    res.json("done")
})

app.get('/getallclasses', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const classes = await prisma.class.findMany({
        select:{
            id:true,
            name:true,
            students:true,
            teacher:true            
        }
    })
    res.json(classes)
})


app.post('/createteacher', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const NewTeacher = req.body as Teacher;
    await prisma.teacher.create({
        data: NewTeacher
    })
    res.json("done")
})

app.get('/getallsons', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.admin.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const sons = await prisma.son.findMany()
    res.json(sons)
})
// son requests

app.post('/createson', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.father.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json('Invalid token' )
        }   
    }
    else{
        return res.status(401).json('Invalid token')
    }
    const NewSon = req.body as Son;
    await prisma.son.create({
        data: NewSon
    })
    res.json("done")
    const data = req.body as Son;
    const newStudent = await prisma.son.create({
        data: data
    });
    res.json(newStudent);
})




// Teacher requests


app.post('/teacher/login', async (req: Request, res: Response) => {
    const { username, password } = req.body

    const teacher = await prisma.teacher.findUnique({
        where: { username : username },
    });

    if (!teacher || teacher.password!== password) {
        return res.status(401).json({ error: 'Invalid username or password' })
    }

    res.cookie('tokenauth', teacher.id, {maxAge: 360000})
    res.json('Login successful');
})

app.get('/teacher/logout', async (req: Request, res: Response) => {
    res.clearCookie('tokenauth')
    res.json('Logout successful');
})


app.get('/getmycallouts', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.teacher.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const callouts = await prisma.callout.findMany({
        where : {teacher_id: req.cookies.tokenauth},
        select:{
            name:true,
        }
    })
    res.json(callouts)
})

app.put('/updateCalloutStatus/:calloutname', async (req: Request, res: Response) => {
    if (req.cookies.tokenauth) {
        const tokenauth = req.cookies.tokenauth;
        const admin = await prisma.teacher.findMany({
            where: { id: tokenauth },
        });
        console.log(admin);
        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid token' })
        }   
    }
    else{
        return res.status(401).json({ error: 'Invalid token' })
    }
    const { calloutname } = req.params;
    const check = await prisma.callout.findUnique({
        where: { name: calloutname },
    })
    if (!check) {
        return res.status(404).json('Callout not found');
    }

    const updatedCallout = await prisma.callout.update({
        where: { name: calloutname },
        data: {
            Status: "sendout",
        },
    });

    res.json("done")
});


app.put('/updatestudent/:studentusername', async (req: Request, res: Response) => {
    const { studentusername } = req.params;

    const teacherToken = req.cookies.tokenauth;
    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherToken },
    });

    if (!teacher) {
        return res.status(401).json('Invalid token' )
    }

    const className = teacher.class_name;

    const updatedStudent = await prisma.son.update({
        where: {
            username: studentusername,
        },
        data: {
            teacher : {connect : {username : teacher.name}},
            class: { connect: { name: className } },
        },
    });

    res.json("done")
});

connectDB()
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})