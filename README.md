## Introduction

Welcome to our project, a web application designed to facilitate the process of parents picking up their children from school. The project aims to address common challenges parents face, such as waiting for a teacher to bring their child outside the school premises. The solution involves creating a system where parents can submit a request for their child's release, and the teacher receives immediate notification to assist in the timely pickup.

## Project Features

### Parent Features

1. **Login/Authentication:**
   - Parents can log in using their username and password.
   - User authentication is handled securely.

2. **Request Child Pickup:**
   - Parents can create a request for picking up their child.
   - The system records essential details, such as the child's name, date of birth, and the parent's information.

### Teacher Features

1. **Login/Authentication:**
   - Teachers can log in using their username and password.
   - User authentication is handled securely.

2. **View Callouts:**
   - Teachers can view all pending pickup requests (callouts) assigned to them.

3. **Update Callout Status:**
   - Teachers can update the status of a callout, marking it as "sendout" after assisting the parent.

4. **Update Student Information:**
   - Teachers can update the information of a student, such as assigning them to a specific class and connecting them to the teacher.

### Admin Features

1. **Login/Authentication:**
   - Admins can log in using their username and password.
   - User authentication is handled securely.

2. **Manage Users:**
   - Admins can view and manage information about fathers, teachers, and admins.

3. **View All Callouts:**
   - Admins can view all pickup requests made by parents.

4. **View All Classes and Teachers:**
   - Admins can view information about all classes and teachers.

## Installation and Setup

To run the project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repository.git
   ```

2. Install dependencies:

   ```bash
   cd your-repository
   npm install
   ```

3. Configure the database:

   - Ensure that you have a running database server.
   - Update the database configuration in the `config/db.ts` file.

4. Start the server:

   ```bash
   npm start
   ```

5. Access the application:

   - Open your web browser and navigate to [http://localhost:7999](http://localhost:7999).

## Conclusion

Our project aims to streamline the process of child pickup at school, providing a convenient and efficient solution for both parents and teachers. We hope this system enhances communication and cooperation between parents and the school community.

For any questions or issues, please contact our development team. Thank you for using our application!
