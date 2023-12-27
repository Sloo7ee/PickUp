import express, { Request, Response } from 'express'
import { connectDB, prisma } from "./config/db";
import {Father , Son , Teacher , Class , Callout, Admin, Roles, } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { authorize, protect } from "./verify";
import * as jwt from "jsonwebtoken";

import cors from 'cors';
var cookieParser = require('cookie-parser')


const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors())

const PORT = 7999;

app.post('/login', async (req: Request, res: Response) => {
    const { username , password } = req.body;

    const user = await prisma.roles.findUnique({
        where : { username : username }
    })

    if (!user || user.password !== password) {
        return res.status(401).json('Invalid username or password');
    }

    const token = jwt.sign({ id: user.id, role: user.Role }, process.env.JWT_SECRET as string);
    res.json({ message: 'Login successful', token: token });
});



// Father requests



app.post('/createFather', async (req: Request, res: Response) => {
    const NewFather = req.body as Father;
    try {
        const data = await prisma.father.create({
            data: NewFather,
            
        })
        await prisma.roles.create({
            data : {
                id: data.id,
                Role: "Father",
                username : NewFather.username,
                password : NewFather.password
            }
        })
        res.json("done")
    }
    catch (error: any) {
        if (error.meta?.target === 'Callout_name_key') {
            return res.status(400).json('Callout name already exists');
        }
    }
    
})




function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180; 
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
  
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c;
    return distance;
  }

  
  

  app.get('/bringmysonout/:sonId', protect ,authorize('Father'), async (req, res) => {
    const { sonId } = req.params;
    const userLocation = req.body.location; 
    const user = res.locals.user ;

    const targetLat = 24.85387;  
    const targetLon = 46.71298;  
  
    if (!userLocation) {
      return res.status(400).json('Location data is required');
    }
  
    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, targetLat, targetLon);
    if (distance > 500) {
      return res.status(403).json('It should be over a range of 500 meters to order the son');
    }

    const father = await prisma.father.findUnique({
        where: { id: user.id },
        select: { username: true },
    });

    if (!father) {
        return res.status(401).json('You are not authorized as a father');
    }

    const isSonConnectedToFather = await prisma.son.findUnique({
        where: {
            id: sonId,
            father_username: father.username,
        },
    });

    if (!isSonConnectedToFather) {
        return res.status(401).json('You are not the father of this son')
    }

    const son = await prisma.son.findMany({
        where: { id: sonId },
        include: { father: true, teacher: true, class: true },
    });

    if (!son || son.length === 0) {
        return res.status(404).json('Son not found');
    }


    const fatherCallout = await prisma.callout.create({
        data: {
            name: son[0].name,
            Son: {
                connect: { id: sonId },
            },
            teacher: {
                connect: { username: son[0].teacher?.username },
            },
            class: {
                connect: { name: son[0].class_name || undefined },
            },
            Status: "waiting",
        },
    });
    
    res.json("done");
});


app.delete('/receive/:name', protect, authorize('Father'), async (req, res) => {
    const { name } = req.params;
    const user = res.locals.user ;

    const father = await prisma.father.findUnique({
        where: { id: user.id },
        select: { username: true },
    });

    if (!father) {
        return res.status(401).json('You must be a father to delete a callout.');
    }

    const calloutToDelete = await prisma.callout.findUnique({
        where: { name: name },
    });

    if (!calloutToDelete) {
        return res.status(404).json('Callout not found');
    }

    
    const deletedCallout = await prisma.callout.delete({
        where: { name: name },
    });

    res.json(deletedCallout);
});


// admin requests

app.get('/getallCallouts', authorize('Admin'),async (req: Request, res: Response) => {
    const all = await prisma.callout.findMany()
    res.json(all)
})

app.get('/getallFathers', protect,  async (req: Request, res: Response) => {

   
    const fathers = await prisma.father.findMany({
        select: {
            id: true,
            name: true,
            password: true, 
            son: {
                select: {
                    id: true,
                    name: true,
                    yearofbrith: true,
                },
            },
        },
    });
    
    res.json(fathers);
});


app.post('/createAdmin',authorize('Admin'), async (req: Request, res: Response) => {
    const NewAdmin = req.body as Admin;
    let check = await prisma.admin.findMany({
        where : { username : NewAdmin.username }
    })
    if (check.length > 0) {
        return res.status(400).json('Username already exists');
    }
    const data = await prisma.admin.create({
        data: NewAdmin
    })
    await prisma.roles.create({
        data : {
            id : data.id,
            Role: "Admin",
            username: NewAdmin.username,
            password: NewAdmin.password
        }
    })
    res.json("done")
})

app.get('/getallAdmins',authorize('Admin'), async (req: Request, res: Response) => {

    const admins = await prisma.admin.findMany()
    res.json(admins)
})



app.get('/getallteachers', authorize('Admin') ,async (req: Request, res: Response) => {
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


app.post('/createclass', protect, authorize('Admin'), async (req: Request, res: Response) => {
    const NewClass = req.body as Class;

    try {
        const classCreated = await prisma.class.create({
            data: NewClass
        });
        res.json(classCreated);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});


app.get('/getallclasses',authorize('Admin'), async (req: Request, res: Response) => {
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


app.post('/createteacher', authorize('Admin') , async (req: Request, res: Response) => {
    const NewTeacher = req.body as Teacher;
    
    let check = await prisma.teacher.findMany({
        where: { username: NewTeacher.name }
    })
    if (check.length > 0) {
        return res.status(400).json('This teacher username already exists');
    }
    const data = await prisma.teacher.create({
        data: NewTeacher
    })
    await prisma.roles.create({
        data : {
            id : data.id,
            Role : "Teacher",
            username : NewTeacher.username,
            password : NewTeacher.password,
        }
    })


    res.json("done")
})

app.get('/sons', protect, async (req, res) => {
    try {
      const user = res.locals.user ;

      const fatherWithSons = await prisma.father.findMany({
        where: { id: user.id },
        include: { son: true },
      });
  
      res.json(fatherWithSons);
    } catch (error) {
      console.error('Error fetching sons data:', error);
      res.status(500).send('Internal Server Error');
    }
});


app.get('/getallsons', authorize('Admin') ,async (req: Request, res: Response) => {
    const sons = await prisma.son.findMany()
    res.json(sons)
})

// son requests


app.post('/createson', protect, authorize('Father'), async (req: Request, res: Response) => {
    const user = res.locals.user ;  
    const { name, c, yearofbrith } = req.body; 

    const existingSon = await prisma.son.findUnique({
        where: { c: c }
    });

    if (existingSon) {
        return res.status(400).json('A son with this identifier already exists');
    }

    const father = await prisma.father.findUnique({
        where: { username: user.username }  
    });

    if (!father) {
        return res.status(401).json('You must be a registered father to create a son');
    }

    try {
        const son = await prisma.son.create({
            data: {
                name: name,
                c: c,
                yearofbrith: yearofbrith,
                father_username: father.username  
                
            }
        });
        res.json(son);
    } catch (error) {
        console.error('Error creating son:', error);
        res.status(500).send('Internal Server Error');
    }
});




// Teacher requests






app.get('/getmycallouts', protect, authorize('Teacher'), async (req: Request, res: Response) => {
    const user = res.locals.user ;  

    const callouts = await prisma.callout.findMany({
        where: { teacher_id: user.name },  
        select: {
            name: true,
        }
    });
    
    res.json(callouts);
});


app.put('/updateCalloutStatus/:calloutname', authorize('Teacher') ,async (req: Request, res: Response) => {
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


app.put('/updatestudent/:studentusername', protect, authorize('Teacher'), async (req: Request, res: Response) => {
    const { studentusername } = req.params;

    const user = res.locals.user ;  

    const teacher = await prisma.teacher.findUnique({
        where: { username: user.username },
    });

    if (!teacher) {
        return res.status(401).json('Not authorized or invalid teacher')
    }

    try {
        const updatedStudent = await prisma.son.update({
            where: {
                c: studentusername,  
            },
            data: {
                teacher : { connect : { username: teacher.username } },
                class: { connect: { name: teacher.class_name } },  
            },
        });

        res.json(updatedStudent);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).send('Internal Server Error');
    }
});


connectDB()
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})