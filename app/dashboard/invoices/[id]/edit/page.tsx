import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { fetchInvoiceById } from '@/app/lib/data'; 
import { notFound } from 'next/navigation';

export default async function Page({params} : {params : {id : string}}) {
    //page components also accept a prop called params which you can use to access the id
    const id = params.id
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ]) 

    if (!invoice){
      notFound(); //this will trigger the not-found.tsx
    }

    return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}