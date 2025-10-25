import React, { useState } from 'react';
import { ListMusic, Plus, Trash2, GripVertical, Calendar, Lock, Unlock, PlusCircle, Edit2, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Setlist, Song, SetlistItem } from '../types';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { cn } from './ui/utils'; // Import cn if not already imported elsewhere
// *** Import DND library components here ***

interface SetlistManagerProps {
  setlists: Setlist[];
  songs: Song[];
  onSongClick: (songId: string) => void;
  onCreateSetlist: (name: string) => void;
  onUpdateSetlist: (updatedSetlist: Setlist) => void;
  onDeleteSetlist: (setlistId: string) => void;
  // onReorderSetlists?: (startIndex: number, endIndex: number) => void;
}

interface SetlistPopupProps {
    setlist: Setlist;
    songs: Song[];
    onClose: () => void;
    onUpdateItems: (updatedItems: SetlistItem[]) => void;
    onAddNote: (noteContent: string, index: number) => void;
    onUpdateNote: (noteId: string, newContent: string) => void;
    onDeleteNote: (noteId: string) => void;
    onDeleteSong: (songId: string) => void;
    onAddSongClick: () => void;
    onSongClick: (songId: string) => void;
}

function SetlistPopup({
    setlist, songs, onClose, onUpdateItems,
    onAddNote, onUpdateNote, onDeleteNote, onDeleteSong,
    onAddSongClick, onSongClick
}: SetlistPopupProps) {
    const [isLocked, setIsLocked] = useState(true);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteEditText, setNoteEditText] = useState('');
    const [addingNoteAtIndex, setAddingNoteAtIndex] = useState<number | null>(null);
    const [newNoteText, setNewNoteText] = useState('');

    const getSongInfo = (songId: string) => songs.find(s => s.id === songId);

    // --- Placeholder DND ---
    // const sensors = useSensors(...)
    // const handleDragEndKit = (event: any) => { ... logic to call onUpdateItems ... };
    // --- Fim Placeholder DND ---

    const handleStartNoteEdit = (noteItem: SetlistItem & { type: 'note' }) => { if(isLocked)return;setEditingNoteId(noteItem.id);setNoteEditText(noteItem.content);};
    const handleSaveNoteEdit = () => { if(editingNoteId&&!isLocked){onUpdateNote(editingNoteId,noteEditText);}setEditingNoteId(null);setNoteEditText('');};
    const handleStartAddNote = (index: number) => { if(isLocked)return;setAddingNoteAtIndex(index);setNewNoteText('');}
    const handleConfirmAddNote = () => { if(addingNoteAtIndex!==null&&newNoteText.trim()&&!isLocked){onAddNote(newNoteText.trim(),addingNoteAtIndex);}setAddingNoteAtIndex(null);setNewNoteText('');}
    const confirmAndDeleteSong=(sId:string,sTitle:string)=>{if(!isLocked&&window.confirm(`Remove "${sTitle}"?`))onDeleteSong(sId);}
    const confirmAndDeleteNote=(nId:string)=>{if(!isLocked&&window.confirm('Delete note?'))onDeleteNote(nId);}

    return (
        // *** <DndContext ...> ***
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex justify-between items-center pr-10">
                    <span className="truncate">{setlist.name}</span>
                    <Button variant="ghost" size="icon" onClick={()=>setIsLocked(!isLocked)} className={`w-8 h-8 ${isLocked?"text-gray-500 hover:text-gray-700":"text-blue-500 hover:text-blue-700"}`}>{isLocked?<Lock className="w-5 h-5"/>:<Unlock className="w-5 h-5"/>}</Button>
                </DialogTitle>
                <DialogDescription>Reorder, add notes/songs. {isLocked?'Unlock':'Lock'} via <Lock className="w-3 h-3 inline"/> icon to {isLocked?'edit':'prevent edits'}.</DialogDescription>
            </DialogHeader>

            {/* *** <SortableContext ...> *** */}
            <ScrollArea className="flex-1 -mx-6 px-6 border-y">
                <div className="py-4 space-y-1">
                    {setlist.items.map((item, index) => (
                         <React.Fragment key={item.id}>
                             {/* Botão Add Note ANTES */}
                             {!isLocked && (
                                <div className="flex justify-center my-1 h-6 items-center">
                                    {addingNoteAtIndex === index ? (
                                         <div className="flex items-center gap-1 w-full p-1 bg-yellow-100 rounded border border-yellow-300"> <Input placeholder="Enter note..." value={newNoteText} onChange={(e)=>setNewNoteText(e.target.value)} className="flex-1 text-sm italic h-7 px-2" autoFocus onKeyDown={(e)=>{if(e.key==='Enter')handleConfirmAddNote();if(e.key==='Escape')setAddingNoteAtIndex(null);}} onBlur={()=>setTimeout(()=>{if(addingNoteAtIndex===index)setAddingNoteAtIndex(null)},100)}/> <Button size="sm" onClick={handleConfirmAddNote} disabled={!newNoteText.trim()} className="h-7 px-2 text-xs">Add</Button> <Button size="sm" variant="ghost" onClick={()=>setAddingNoteAtIndex(null)} className="h-7 px-2 text-xs">Cancel</Button> </div>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50 h-6 px-2 opacity-50 hover:opacity-100" onClick={()=>handleStartAddNote(index)}><Plus className="w-3 h-3 mr-1"/> Add Note Here</Button>
                                    )}
                                </div>
                             )}

                             {/* --- Item da Lista --- */}
                             {/* *** <SortableItem key={item.id} id={item.id} isLocked={isLocked}> {(dndKitProps) => ( *** */}
                             <div
                                // *** ref={dndKitProps.setNodeRef} style={dndKitProps.style} {...dndKitProps.attributes} ***
                                className={`flex items-center gap-2 p-2 rounded transition-shadow ${!isLocked?'hover:bg-gray-50 shadow-sm':'opacity-90'} ${item.type==='note'?'bg-yellow-50/50':'bg-white'}`}
                             >
                                {!isLocked && ( <div /* *** {...dndKitProps.listeners} *** */ className="cursor-grab text-gray-400 hover:text-gray-600 p-1" aria-label="Drag to reorder"><GripVertical className="w-5 h-5"/></div> )}
                                <span className="text-sm text-gray-400 w-6 text-right font-medium">{index + 1}.</span>

                                {item.type === 'song' ? (
                                    (() => {
                                        const songInfo = getSongInfo(item.id);
                                        const title = songInfo?.title || 'Unknown Song';
                                        const artist = songInfo?.artist || 'Unknown Artist';
                                        return (
                                            <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                                                <div className="flex-1 min-w-0" onClick={() => onSongClick(item.id)} title={`Go to song: ${title}`}>
                                                    <p className="truncate font-medium cursor-pointer hover:text-blue-700 hover:underline">{title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{artist}</p>
                                                </div>
                                                {!isLocked && ( <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600 shrink-0" onClick={() => confirmAndDeleteSong(item.id, title)} aria-label={`Remove ${title}`}><Trash2 className="w-4 h-4"/></Button> )}
                                            </div>
                                        );
                                    })()
                                ) : ( // item.type === 'note'
                                    <div className="flex-1 flex items-center gap-2 text-sm italic text-gray-700 min-w-0">
                                        {editingNoteId === item.id ? (
                                            <> <Textarea value={noteEditText} onChange={(e)=>setNoteEditText(e.target.value)} rows={1} className="flex-1 text-sm italic bg-white" autoFocus onBlur={handleSaveNoteEdit} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSaveNoteEdit();}if(e.key==='Escape'){setEditingNoteId(null);setNoteEditText('');}}}/> </>
                                        ) : (
                                            <span className="flex-1 whitespace-pre-wrap py-1 cursor-text" onClick={() => handleStartNoteEdit(item)}>{item.content}</span>
                                        )}
                                        {!isLocked && editingNoteId !== item.id && (
                                            <div className="ml-auto flex items-center shrink-0">
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-yellow-100 hover:text-gray-700" onClick={()=>handleStartNoteEdit(item)} aria-label="Edit note"><Edit2 className="w-4 h-4"/></Button>
                                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600" onClick={()=>confirmAndDeleteNote(item.id)} aria-label="Delete note"><Trash2 className="w-4 h-4"/></Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                             {/* *** )} </SortableItem> *** */}
                         </React.Fragment>
                    ))}
                     {/* Botão Add Note no FINAL */}
                     {!isLocked && (
                        <div className="flex justify-center mt-3 h-6 items-center">
                            {addingNoteAtIndex === setlist.items.length ? (
                                <div className="flex items-center gap-1 w-full p-1 bg-yellow-100 rounded border border-yellow-300"><Input placeholder="Enter note..." value={newNoteText} onChange={(e)=>setNewNoteText(e.target.value)} className="flex-1 text-sm italic h-7 px-2" autoFocus onKeyDown={(e)=>{if(e.key==='Enter')handleConfirmAddNote();if(e.key==='Escape')setAddingNoteAtIndex(null);}} onBlur={()=>setTimeout(()=>{if(addingNoteAtIndex===setlist.items.length)setAddingNoteAtIndex(null)},100)}/><Button size="sm" onClick={handleConfirmAddNote} disabled={!newNoteText.trim()} className="h-7 px-2 text-xs">Add</Button><Button size="sm" variant="ghost" onClick={()=>setAddingNoteAtIndex(null)} className="h-7 px-2 text-xs">Cancel</Button></div>
                            ) : (
                               <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50 h-6 px-2 opacity-50 hover:opacity-100" onClick={()=>handleStartAddNote(setlist.items.length)}><Plus className="w-3 h-3 mr-1"/> Add Note Here</Button>
                            )}
                        </div>
                     )}
                </div>
            </ScrollArea>
             {/* *** </SortableContext> *** */}

            {/* **** CORREÇÃO AQUI **** */}
            <DialogFooter className="pt-4 border-t gap-2 sm:justify-end"> {/* Use sm:justify-end */}
                {!isLocked && (
                    <Button variant="outline" onClick={onAddSongClick} className="mr-auto sm:mr-0"> {/* Ajusta margem */}
                        <PlusCircle className="w-4 h-4 mr-2"/> Add Song
                    </Button>
                )}
                <DialogClose asChild>
                    {/* Remove a classe condicional que causava o erro */}
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
             {/* **** FIM DA CORREÇÃO **** */}
        </DialogContent>
         // *** </DndContext> ***
    );
}


export function SetlistManager({
  setlists,
  songs,
  onSongClick,
  onCreateSetlist,
  onUpdateSetlist,
  onDeleteSetlist,
  // onReorderSetlists,
}: SetlistManagerProps) {
  const [newSetlistName, setNewSetlistName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);

  const handleCreateSetlistSubmit = () => { if(newSetlistName.trim()){onCreateSetlist(newSetlistName);setNewSetlistName('');setCreateDialogOpen(false);} };
  const getSongTitle = (songId: string) => songs.find((s) => s.id === songId)?.title || 'Unknown Song';
  const formatDate = (date?: Date) => { if(!date)return null;return new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',}); };
  const handleCardClick = (setlist: Setlist) => { setSelectedSetlist(setlist); setPopupOpen(true); };

  // --- Funções de Callback para o Popup ---
   const handleUpdateSetlistItems = (updatedItems: SetlistItem[]) => { if(selectedSetlist){const updated={...selectedSetlist,items:updatedItems};onUpdateSetlist(updated);setSelectedSetlist(updated);} };
   const handleAddNoteToSetlist = (noteContent: string, index: number) => { if(selectedSetlist){const newNote:SetlistItem={type:'note',id:`note-${Date.now().toString(36)}`,content:noteContent};const newItems=[...selectedSetlist.items];newItems.splice(index,0,newNote);handleUpdateSetlistItems(newItems);} };
   const handleUpdateNoteInSetlist = (noteId: string, newContent: string) => { if(selectedSetlist){const newItems=selectedSetlist.items.map(item=>item.type==='note'&&item.id===noteId?{...item,content:newContent}:item);handleUpdateSetlistItems(newItems);} };
   const handleDeleteNoteFromSetlist = (noteId: string) => { if(selectedSetlist){const newItems=selectedSetlist.items.filter(item=>!(item.type==='note'&&item.id===noteId));handleUpdateSetlistItems(newItems);} };
   const handleDeleteSongFromSetlist = (songId: string) => { if(selectedSetlist){const newItems=selectedSetlist.items.filter(item=>!(item.type==='song'&&item.id===songId));handleUpdateSetlistItems(newItems);} };
   const handleAddSongToSetlist = (songId: string) => { if(selectedSetlist){if(selectedSetlist.items.some(item=>item.type==='song'&&item.id===songId))return;const newSongItem:SetlistItem={type:'song',id:songId};handleUpdateSetlistItems([...selectedSetlist.items,newSongItem]);} }
   const handleOpenSongSelector = () => { alert("Song Selector to be implemented."); /* ... Lógica para abrir seletor ... */ }
   // --- Fim Callbacks ---

    // --- Placeholder DND Setlists ---
    // const handleSetlistDragEnd = (result: any) => { ... };
    // --- Fim DND Setlists ---

  // *** <DragDropContext onDragEnd={handleSetlistDragEnd}> ***
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between"> <h2 className="text-xl font-semibold">Setlists</h2> <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}> <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1"/> New Setlist</Button></DialogTrigger> <DialogContent className="sm:max-w-[400px]"><DialogHeader><DialogTitle>Create New Setlist</DialogTitle></DialogHeader><div className="space-y-3 mt-4"><Input placeholder="Setlist name" value={newSetlistName} onChange={(e)=>setNewSetlistName(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleCreateSetlistSubmit()} autoFocus/><Button onClick={handleCreateSetlistSubmit} className="w-full">Create</Button></div></DialogContent> </Dialog> </div>

      {/* Lista de Setlists */}
      {/* *** <Droppable droppableId="all-setlists" direction="horizontal">{(providedList) => ( *** */}
      <div /* *** {...providedList.droppableProps} ref={providedList.innerRef} *** */ className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setlists.map((setlist, index) => (
          // *** <Draggable key={setlist.id} draggableId={setlist.id} index={index}>{(providedCard) => ( ***
          <div /* *** ref={providedCard.innerRef} {...providedCard.draggableProps} *** */ key={setlist.id} className="relative">
             {/* Drag Handle */} <div /* *** {...providedCard.dragHandleProps} *** */ className="absolute top-2 left-2 text-gray-300 hover:text-gray-500 cursor-grab p-1 z-10 opacity-50 hover:opacity-100 transition-opacity"><GripVertical className="w-5 h-5"/></div>
             <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col group" onClick={() => handleCardClick(setlist)}>
                 <CardHeader className="pb-3 pt-4 pl-10 pr-4 relative">
                    <CardTitle className="flex items-start justify-between">
                       <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><ListMusic className="w-5 h-5 flex-shrink-0 text-gray-500"/><span className="truncate font-semibold">{setlist.name}</span></div>{setlist.eventDate&&(<div className="flex items-center gap-1 mt-2 text-sm text-gray-500"><Calendar className="w-4 h-4"/><span className="text-xs">{formatDate(setlist.eventDate)}</span></div>)}</div>
                       <Badge variant="secondary" className="flex-shrink-0 text-xs">{setlist.items.length} items</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 hover:bg-red-100 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e)=>{e.stopPropagation();if(window.confirm(`Delete setlist "${setlist.name}"?`))onDeleteSetlist(setlist.id);}} aria-label={`Delete setlist ${setlist.name}`}><Trash2 className="w-4 h-4"/></Button>
                 </CardHeader>
                 <CardContent className="pt-0 pb-4 px-4 flex-1">
                    <Separator className="mb-3"/>
                    <div className="space-y-1">
                        {setlist.items.length === 0 && ( <div className="text-xs text-gray-400 text-center py-4 italic">Empty setlist</div> )}
                        {setlist.items.slice(0, 5).map((item, itemIndex) => (
                           <div key={item.id} className="flex items-center gap-2 text-sm p-1 rounded group">
                             <span className="text-gray-400 w-5 text-right text-xs">{itemIndex + 1}.</span>
                             {item.type === 'song' ? ( <span className="flex-1 truncate text-gray-800 cursor-pointer hover:text-blue-700" onClick={(e)=>{e.stopPropagation(); onSongClick(item.id);}}>{getSongTitle(item.id)}</span> ) : ( <span className="flex-1 truncate italic text-gray-500 text-xs">"{item.content}"</span> )}
                           </div>
                        ))}
                        {setlist.items.length > 5 && ( <div className="text-xs text-gray-400 text-center pt-1">+{setlist.items.length - 5} more items...</div> )}
                    </div>
                    {setlist.notes && (<div className="mt-3 pt-3 border-t"><p className="text-xs text-gray-500 italic line-clamp-2">{setlist.notes}</p></div>)}
                 </CardContent>
             </Card>
          </div>
          // *** )} </Draggable> ***
        ))}
        {/* *** {providedList.placeholder} *** */}
      </div>
       {/* *** )} </Droppable> *** */}

      {setlists.length === 0 && ( <div className="text-center py-12 text-gray-500"><ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50"/><p>No setlists created yet</p><p className="text-sm mt-2">Create your first setlist</p></div> )}

      {/* Popup de Edição */}
      {selectedSetlist && ( <Dialog open={popupOpen} onOpenChange={(open)=>{if(!open)setSelectedSetlist(null);setPopupOpen(open);}}> <SetlistPopup setlist={selectedSetlist} songs={songs} onClose={()=>setPopupOpen(false)} onUpdateItems={handleUpdateSetlistItems} onAddNote={handleAddNoteToSetlist} onUpdateNote={handleUpdateNoteInSetlist} onDeleteNote={handleDeleteNoteFromSetlist} onDeleteSong={handleDeleteSongFromSetlist} onAddSongClick={handleOpenSongSelector} onSongClick={(songId)=>{setPopupOpen(false);onSongClick(songId);}}/> </Dialog> )}
    </div>
     // *** </DragDropContext> ***
  );
}