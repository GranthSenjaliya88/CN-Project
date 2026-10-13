"""Deterministic ARQ comparison lab. Absolute frame IDs avoid sequence wrap ambiguity.
No corruption/reordering; optional one-shot DATA and ACK loss. ACK arrival wins ties.
GBN uses cumulative ACKs and one oldest-frame timer; SR uses per-frame timers.
"""
import heapq
import math

def run_lab(raw):
    if not isinstance(raw, dict):
        raise ValueError("A JSON object is required.")
    protocol=raw.get("protocol","sw")
    if protocol not in ("sw","gbn","sr"): raise ValueError("Choose sw, gbn or sr.")
    def number(key,default,lo,hi,integer=False):
        v=raw.get(key,default)
        if isinstance(v,bool): raise ValueError(f"Invalid {key}.")
        try: v=float(v)
        except (ValueError,TypeError,OverflowError): raise ValueError(f"Invalid {key}.")
        if not math.isfinite(v) or not lo<=v<=hi or (integer and not v.is_integer()):
            raise ValueError(f"{key} must be {'an integer' if integer else 'a number'} from {lo} to {hi}.")
        return int(v) if integer else v
    n=number('frames',6,1,20,True)
    w=number('window',4,1,8,True) if protocol!='sw' else 1
    travel=number('travel',600,1,3600000)
    delay=number('ack_delay',200,0,3600000)
    timeout=number('timeout',2000,1,3600000)
    data_loss=number('drop_data',0,0,n,True)
    ack_loss=number('drop_ack',0,0,n,True)
    config=dict(protocol=protocol,frames=n,window=w,travel=travel,ack_delay=delay,timeout=timeout,drop_data=data_loss,drop_ack=ack_loss)
    queue=[]; counter=0; events=[]; packets=[]; attempts={}; acknowledged=set(); buffer=set(); delivered=[]
    base=1; next_frame=1; expected=1; timers={}; gbn_token=0; data_dropped=False; ack_dropped=False
    stats=dict(transmissions=0,retransmissions=0,duplicates=0,out_of_order=0,acks_sent=0,acks_accepted=0,data_lost=0,acks_lost=0)
    def push(t,priority,kind,**payload):
        nonlocal counter
        counter+=1;heapq.heappush(queue,(t,priority,counter,kind,payload))
    def log(t,kind,frame,description):
        events.append(dict(time=t,kind=kind,frame=frame,description=description,base=base,next_frame=next_frame,expected=expected,acked=sorted(acknowledged),buffer=sorted(buffer),delivered=list(delivered),timers={str(k):v[1] for k,v in timers.items()},stats=dict(stats)))
    def start_gbn(t):
        nonlocal gbn_token
        gbn_token+=1;timers.clear()
        if base<next_frame:
            timers[base]=(gbn_token,t+timeout);push(t+timeout,3,'timeout',frame=base,token=gbn_token)
    def send(t,frame):
        nonlocal data_dropped
        attempts[frame]=attempts.get(frame,0)+1;attempt=attempts[frame]
        stats['transmissions']+=1;stats['retransmissions']+=int(attempt>1)
        lost=frame==data_loss and not data_dropped
        if lost: data_dropped=True
        packets.append(dict(id=len(packets)+1,direction='data',frame=frame,seq=(frame-1)%2 if protocol=='sw' else frame,attempt=attempt,start=t,end=t+travel*(.5 if lost else 1),lost=lost))
        if protocol!='gbn':
            timers[frame]=(attempt,t+timeout);push(t+timeout,3,'timeout',frame=frame,token=attempt)
        log(t,'retry' if attempt>1 else 'send',frame,f"{'Retransmit' if attempt>1 else 'Send'} DATA {frame}, attempt {attempt}")
        push(t+travel*(.5 if lost else 1),1,'data_loss' if lost else 'data_arrival',frame=frame)
    def fill(t):
        nonlocal next_frame
        old=next_frame
        while next_frame<=n and next_frame<base+w:
            frame=next_frame;next_frame+=1;send(t,frame)
        if protocol=='gbn' and old==base and next_frame>base:start_gbn(t)
    fill(0);log(0,'window',None,'Initial sender window')
    complete=None
    while queue:
        if len(events)>5000:raise ValueError('Too many events: increase timeout or reduce delay/frame count.')
        t,_,_,kind,p=heapq.heappop(queue);f=p.get('frame')
        if kind=='data_loss':stats['data_lost']+=1;log(t,kind,f,f'DATA {f} lost in channel');continue
        if kind=='ack_loss':stats['acks_lost']+=1;log(t,kind,f,f'ACK {f} lost in channel');continue
        if kind=='data_arrival':
            if f<expected or f in buffer:
                stats['duplicates']+=1;log(t,'duplicate',f,f'Duplicate DATA {f}: payload not delivered again')
            elif f==expected or protocol=='sr':
                buffer.add(f)
                while expected in buffer:
                    buffer.remove(expected);delivered.append(expected);expected+=1
                log(t,'receive',f,f'DATA {f} received'+(' and buffered' if f in buffer else '; ordered payloads delivered'))
            else:
                stats['out_of_order']+=1;log(t,'discard',f,f'Out-of-order DATA {f} discarded; expecting {expected}')
            ack=f if protocol=='sr' else expected-1
            push(t+delay,2,'ack_send',frame=ack)
        elif kind=='ack_send':
            stats['acks_sent']+=1
            lost=f==ack_loss and ack_loss!=0 and not ack_dropped
            if lost:ack_dropped=True
            packets.append(dict(id=len(packets)+1,direction='ack',frame=f,seq=(f-1)%2 if protocol=='sw' else f,attempt=1,start=t,end=t+travel*(.5 if lost else 1),lost=lost))
            log(t,kind,f,f'Send ACK {f}'+(' (cumulative)' if protocol=='gbn' else ''))
            push(t+travel*(.5 if lost else 1),0,'ack_loss' if lost else 'ack_arrival',frame=f)
        elif kind=='ack_arrival':
            oldbase=base
            valid=base<=f<next_frame and f not in acknowledged
            if valid:
                stats['acks_accepted']+=1
                acknowledged.update(range(base,f+1) if protocol=='gbn' else [f])
                for k in list(timers):
                    if k in acknowledged:timers.pop(k)
                while base in acknowledged:base+=1
                if protocol=='gbn' and base!=oldbase:start_gbn(t)
            log(t,'ack_accept' if valid else 'ack_ignore',f,f'ACK {f} '+('accepted' if valid else 'ignored (already acknowledged)'))
            if base>n:
                if complete is None:complete=t;log(t,'complete',None,'All frames acknowledged')
            else:fill(t);log(t,'window',None,'Sender window updated')
        elif kind=='timeout':
            if f not in timers or timers[f][0]!=p['token'] or f in acknowledged:continue
            log(t,'timeout',f,f'Timer expired for DATA {f}')
            if protocol=='gbn':
                for k in range(base,next_frame):send(t,k)
                start_gbn(t)
            else:send(t,f)
    return dict(config=config,events=events,packets=packets,stats=stats,delivered=delivered,complete=complete,duration=max(e['time'] for e in events),assumptions=['Fixed equal DATA/ACK travel times; no corruption or reordering.','Selected DATA and ACK losses occur once, on the first matching transmission.','Frames are launched together within a window; serialization is not modelled.','SW uses alternating bits; GBN/SR use absolute frame numbers without wrapping in this finite run.','ACK arrival is processed before an equal-time timeout.','GBN ACK k cumulatively acknowledges frames through k; SR ACK k acknowledges only k.'])
