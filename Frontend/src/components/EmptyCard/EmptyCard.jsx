import React from 'react'

const EmptyCard = ({imgSrc, message}) => {
  return (
    <div className='flex flex-col items-center justify-center mt-20'>
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkT8-MKau5X0mDj7fo5t0Qcq5Hhd5gWBztww&s"  alt="No notes" className='w-60 ' />
      <p className='w-1/2 text-sm font-medium text-slate-700 text-center leading-7 mt-5'> Start creating your first note! click the 'Add' button to write down your thoughs, ideas, and reminders. Let's get started!</p>
    </div>
  )
}

export default EmptyCard
