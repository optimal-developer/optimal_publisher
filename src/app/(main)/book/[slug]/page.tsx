// src/app/(main)/book/[slug]/page.tsx
import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Icon } from '@iconify/react';
import type { Metadata, ResolvingMetadata } from 'next';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

                            // ... (inside the DetailBookPage component)

// Import data fetching functions and types
import { getBookBySlug, getRecommendedBooks } from "@/features/book/data";
import { Book } from "@/types/book";

// Import extracted components
import DetailItem from "@/components/book/DetailItem";
import FullPageLoader from "@/components/ui/FullPageLoader"; // Assuming this is still needed for suspense, though the page itself is now faster

type Props = {
    params: { slug: string };
};

// Generate dynamic metadata on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const book = await getBookBySlug(params.slug);
    if (!book) {
        return { title: 'Buku Tidak Ditemukan' };
    }
    return {
        title: `${book.title} | Optimal Untuk Negeri`,
        description: book.description,
        openGraph: {
            title: book.title,
            description: book.description,
            images: [`http://127.0.0.1:8000/storage/${book.cover}`],
        },
    };
}

// Main Page Component - Now a Server Component
export default async function DetailBookPage({ params }: Props) {
    const { slug } = params;

    // Fetch data on the server in parallel
    const [bookDetail, recommendedBooks] = await Promise.all([
        getBookBySlug(slug),
        getRecommendedBooks(5)
    ]);

    // Handle not found case
    if (!bookDetail) {
        notFound();
    }

    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);

    return (
        <>
            <section className="my-24 md:py-32 bg-gray-50">
                <div className="mx-auto container px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Book Cover */}
                        <div className="w-full lg:w-1/3">
                            <div className="sticky top-28">
                                <Image
                                    priority
                                    src={`http://127.0.0.1:8000/storage/${bookDetail.cover || "no-image.png"}`}
                                    title={bookDetail.title}
                                    alt={bookDetail.title}
                                    className="w-full h-auto object-cover rounded-lg shadow-lg"
                                    width={500}
                                    height={750}
                                />
                            </div>
                        </div>

                        {/* Book Details */}
                        <div className="w-full lg:w-2/3">
                            <h1 className="max-sm:text-xl text-2xl md:text-4xl font-bold text-gray-900 mb-2">{bookDetail.title}</h1>
                            <div className="mb-6">
                                <p className="mb-2 text-sm text-gray-600">
                                    {bookDetail.created_at && new Date(bookDetail.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} {bookDetail.isbn ? ' | ISBN: ' + bookDetail.isbn : ""}
                                </p>

                                {Array.isArray(bookDetail.categories) && bookDetail.categories.length > 0 && (
                                    <div className="flex gap-2 mb-2">
                                        {bookDetail.categories.map((category: any) => (
                                            <span key={category.id} className="badge badge-outline badge-primary max-sm:text-sm text-fuchsia-800">{category.category}</span>
                                        ))}
                                    </div>
                                )}
                                {Array.isArray(bookDetail.book_authors) && bookDetail.book_authors.length > 0 && (
                                    <p className="max-sm:text-sm text-md text-gray-600 mb-3">
                                        ditulis oleh <span className="font-semibold text-gray-800">{bookDetail.book_authors.map((author: any) => author.book_writter?.name).join(', ')}</span>
                                    </p>
                                )}
                            </div>

                            <div className="mb-8">
                                <span className="max-sm:text-xl max-xl:text-3xl text-4xl font-bold text-fuchsia-800">
                                    {(bookDetail.price ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bookDetail.price) : 'Rp. 0')}
                                </span>
                            </div>
 
                            <a
                                href={`https://wa.me/6285156172215?text=Halo, saya tertarik dengan buku "${bookDetail.title}"`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-3 w-full md:w-auto rounded-md bg-fuchsia-800 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-fuchsia-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-700 focus:ring-offset-2 transition-colors duration-300"
                            >
                                <Icon icon="tabler:brand-whatsapp" className="size-6" />
                                <span className="max-sm:text-sm">Pesan via WhatsApp</span>
                            </a>

                            <hr className="my-8 border-gray-200" />

                            <h2 className="max-sm:text-lgtext-2xl font-bold text-gray-800 mb-6">Detail Buku</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                <DetailItem label="ISBN" value={bookDetail.isbn} />
                                <DetailItem label="Kategori" value={bookDetail.categories?.category} />
                                {/* Add other DetailItem fields as needed, ensuring data exists */}
                            </div>

                            

                            {bookDetail.description && (
                                <>
                                    <hr className="my-8 border-gray-200" />
                                    <h2 className="max-sm:text-lg text-2xl font-bold text-gray-800 mb-4">Deskripsi</h2>
                                    <div
                                        className="prose prose-lg max-w-none text-gray-600 text-editor"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bookDetail.description) }}
                                    ></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
            {/* Recommended books section can be added here, passing `recommendedBooks` */}
        </>
    );
}