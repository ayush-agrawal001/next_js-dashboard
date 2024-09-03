"use server";

import {z} from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
    id : z.string(),
    
    // Zod already throws an error if the customer field is empty
    // but adding a friendly message if the user doesn't select anything    
    customerId : z.string({
      invalid_type_error : 'Please select a customer'
    }),

    amount : z.coerce
      .number()// coerce (change) from a string to a number      
      .gt(0, { message: 'Please enter an amount greater than $0.' }),
      //always want the amount greater than 0 with the .gt() function.

    status : z.enum(["pending", "paid"] , {
      invalid_type_error: 'Please select an invoice status.',
    }),
    
    date : z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });  

export type State = {
  errors? : {
    customerId? : string[];
    amount? : string[];
    status? : string[];
  };
  message? : string | null
}

export async function createInvoice(prevState: State, formData: FormData){
  const validatedFields  = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
    try{
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `
      // console.log(rawFormData) //prints in terminal not in console because of use server
    }catch(err){
      return { message: 'Database Error: Failed to Create Invoice.' };
    }
    revalidatePath("/dashboaed/invoices") //This helps in clear the existing cache and 
    // then fresh data will be fetched
    redirect("/dashboard/invoices");

}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  
  try{
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    
  }catch(err){
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
  // redirect works by throwing an error,(301, 302)
  // which would be caught by the catch block. 
  // To avoid this, you can call redirect after try/catch
}
  
export async function deleteInvoice(id: string) {
  try{
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');    
  }catch(err){
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData : FormData 
) {
  try {
    await signIn("credentials", formData)
  }catch(error){
    if (error instanceof AuthError){
      switch (error.type){
        case "CredentialsSignin":
          return "Invalid Credentials"
        default :
          return "Something Went Wrong"
      }
    }
    throw error;
  }
}









